const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// Polyfill for Web Crypto API (required by simplewebauthn on Node < 19)
if (typeof globalThis.crypto === 'undefined') {
    const { crypto } = require('node:crypto');
    globalThis.crypto = crypto;
}

const { pool } = require('../../Utils/db');
const { isoUint8Array } = require('@simplewebauthn/server/helpers');

// RP ID (Relaying Party ID) - must match the domain in the browser address bar
const getRpId = (req) => {
    const host = req.get('host');
    if (!host) return 'propeople.cloud';
    return host.split(':')[0]; // Return the domain/IP exactly as it appears (no port)
};

const rpName = 'HRM ProPeople';

const getOrigin = (req) => {
    const origin = req.get('origin') || req.get('referer');
    if (!origin) return 'https://propeople.cloud';
    // Remove trailing slash if exists
    return origin.replace(/\/$/, '');
};

/**
 * 1. Registration - Step 1: Generate Options
 */
async function getRegistrationOptions(req, res) {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Unauthenticated' });

        // Fetch existing credentials to exclude them
        const [existing] = await pool.execute(
            'SELECT credential_id FROM employee_biometrics WHERE employee_id = ?',
            [user.id]
        );

        const rpID = getRpId(req);
        console.log(`[Biometric] Generating registration options for ${user.id} (RP ID: ${rpID})`);

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: isoUint8Array.fromUTF8String(String(user.id)),
            userName: user.email || user.Official_Email || 'user',
            userDisplayName: user.name || user.Employee_Name || 'Employee',
            attestationType: 'none',
            excludeCredentials: existing.map(cred => ({
                id: cred.credential_id,
                type: 'public-key',
                transports: ['internal'],
            })),
            authenticatorSelection: {
                // 'platform' forces Fingerprint/FaceID on the device. 
                // Leaving it out allows 'Cross-platform' (USB keys or using Phone as key for PC)
                userVerification: 'preferred',
                residentKey: 'preferred',
            },
        });

        // Save challenge to session for step 2
        req.session.currentRegistrationChallenge = options.challenge;

        return res.json(options);
    } catch (err) {
        console.error('getRegistrationOptions error:', err);
        return res.status(500).json({ message: 'Server error generating registration options' });
    }
}

/**
 * 1. Registration - Step 2: Verify Response
 */
async function verifyRegistration(req, res) {
    try {
        const user = req.session.user;
        const { body } = req;
        const expectedChallenge = req.session.currentRegistrationChallenge;

        if (!user || !expectedChallenge) {
            return res.status(400).json({ message: 'Missing session data' });
        }

        const rpID = getRpId(req);
        const origin = getOrigin(req);
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });

        if (verification.verified && verification.registrationInfo) {
            const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

            // Save to DB
            // simplewebauthn returns Uint8Array, we convert to base64 for DB storage
            await pool.execute(
                `INSERT INTO employee_biometrics (employee_id, credential_id, public_key, counter, device_name) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    user.id,
                    Buffer.from(credentialID).toString('base64'),
                    Buffer.from(credentialPublicKey).toString('base64'),
                    counter,
                    req.body.deviceName || 'Mobile Device'
                ]
            );

            delete req.session.currentRegistrationChallenge;
            return res.json({ verified: true });
        }

        return res.status(400).json({ verified: false, message: 'Verification failed' });
    } catch (err) {
        console.error('verifyRegistration error:', err);
        return res.status(500).json({ message: 'Server error verifying registration' });
    }
}

/**
 * 2. Authentication (Punch) - Step 1: Generate Options
 */
async function getAuthenticationOptions(req, res) {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).json({ message: 'Unauthenticated' });

        const [credentials] = await pool.execute(
            'SELECT credential_id FROM employee_biometrics WHERE employee_id = ?',
            [user.id]
        );

        if (credentials.length === 0) {
            return res.status(400).json({ message: 'No biometric device registered for this account' });
        }

        const rpID = getRpId(req);
        console.log(`[Biometric] Generating auth options for ${user.id} (RP ID: ${rpID})`);

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: credentials.map(cred => ({
                id: Buffer.from(cred.credential_id, 'base64'),
                type: 'public-key',
                transports: ['internal'],
            })),
            userVerification: 'preferred',
        });

        // Save challenge to session for step 2
        req.session.currentAuthenticationChallenge = options.challenge;

        return res.json(options);
    } catch (err) {
        console.error('getAuthenticationOptions error:', err);
        return res.status(500).json({ message: 'Server error generating authentication options' });
    }
}

/**
 * 2. Authentication (Punch) - Step 2: Verify & Execute Punch
 * This replaces the "Face Match" part but keeps the rest of the Punch logic.
 * Note: For simplicity, we verify here and then the frontend calls the regular punch with a 'biometric_verified' flag
 * OR we can handle the whole punch here. 
 * Better approach: Verify biometric here, return a temporary token, then punch uses that token.
 * OR: Handle the whole punch here by calling the punch logic manually.
 */
async function verifyAuthentication(req, res) {
    try {
        const user = req.session.user;
        const { body } = req; // authentication response from browser
        const expectedChallenge = req.session.currentAuthenticationChallenge;

        if (!user || !expectedChallenge) {
            return res.status(400).json({ message: 'Missing session data' });
        }

        // Get the credential from DB
        const [credentials] = await pool.execute(
            'SELECT * FROM employee_biometrics WHERE employee_id = ? AND credential_id = ?',
            [user.id, body.id]
        );

        const dbCred = credentials[0];
        if (!dbCred) return res.status(400).json({ message: 'Credential not found' });

        const rpID = getRpId(req);
        const origin = getOrigin(req);
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: {
                credentialID: Buffer.from(dbCred.credential_id, 'base64'),
                credentialPublicKey: Buffer.from(dbCred.public_key, 'base64'),
                counter: dbCred.counter,
            },
        });

        if (verification.verified) {
            // Update counter in DB
            await pool.execute(
                'UPDATE employee_biometrics SET counter = ? WHERE id = ?',
                [verification.authenticationInfo.newCounter, dbCred.id]
            );

            delete req.session.currentAuthenticationChallenge;

            // Mark a flag in session that biometric is verified for this punch
            req.session.biometricVerified = {
                timestamp: Date.now(),
                employeeId: user.id
            };

            return res.json({ verified: true });
        }

        return res.status(400).json({ verified: false, message: 'Biometric verification failed' });
    } catch (err) {
        console.error('verifyAuthentication error:', err);
        return res.status(500).json({ message: 'Server error verifying biometric' });
    }
}

module.exports = {
    getRegistrationOptions,
    verifyRegistration,
    getAuthenticationOptions,
    verifyAuthentication
};
