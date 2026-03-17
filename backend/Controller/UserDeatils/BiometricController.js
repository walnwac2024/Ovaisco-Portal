const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// Polyfill for Web Crypto API (required by simplewebauthn on Node < 19)
if (typeof globalThis.crypto === 'undefined') {
    try {
        const crypto = require('node:crypto');
        if (crypto.webcrypto) {
            globalThis.crypto = crypto.webcrypto;
            console.log('[Biometric] Applied Web Crypto polyfill using node:crypto.webcrypto');
        } else {
            console.error('[Biometric] Web Crypto API not found in node:crypto. Please upgrade Node.js to v16.15.0+');
        }
    } catch (e) {
        console.error('[Biometric] Failed to load node:crypto for polyfill:', e.message);
    }
}

const { pool } = require('../../Utils/db');
const { isoUint8Array } = require('@simplewebauthn/server/helpers');

// RP ID (Relaying Party ID) - must match the domain in the browser address bar
const getRpId = (req) => {
    // Rely on the Origin header which comes directly from the browser's address bar
    const origin = req.get('origin') || req.get('referer');
    if (origin) {
        try {
            const url = new URL(origin);
            return url.hostname;
        } catch (e) {
            console.error('Failed to parse origin in getRpId:', origin);
        }
    }
    // Fallback exactly to what we expect in production if headers are missing
    return 'propeople.cloud';
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
            const { registrationInfo } = verification;
            
            // simplewebauthn v10+ puts these inside a `credential` object.
            // We handle both v9 (direct properties) and v10+ (inside `credential`) to be safe.
            const credentialID = registrationInfo.credentialID || registrationInfo.credential?.id;
            const credentialPublicKey = registrationInfo.credentialPublicKey || registrationInfo.credential?.publicKey;
            const counter = registrationInfo.counter ?? registrationInfo.credential?.counter ?? 0;

            if (!credentialID || !credentialPublicKey) {
                console.error('[Biometric] Failed to extract credential details:', registrationInfo);
                return res.status(400).json({ message: 'Could not extract credential details from registration' });
            }

            // Convert credentialID to base64. In newer versions it might be a base64url string already.
            const credIdStr = typeof credentialID === 'string' 
                ? Buffer.from(credentialID, 'base64url').toString('base64')
                : Buffer.from(credentialID).toString('base64');

            // Save to DB
            await pool.execute(
                `INSERT INTO employee_biometrics (employee_id, credential_id, public_key, counter, device_name) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    user.id,
                    credIdStr,
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
                // Pass as base64url string to avoid TypeError in v10+
                id: Buffer.from(cred.credential_id, 'base64').toString('base64url'),
                type: 'public-key',
                transports: cred.transports ? JSON.parse(cred.transports) : ['internal'],
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
            const { authenticationInfo } = verification;
            const newCounter = authenticationInfo.newCounter ?? dbCred.counter;

            // Update counter in DB
            await pool.execute(
                'UPDATE employee_biometrics SET counter = ? WHERE id = ?',
                [newCounter, dbCred.id]
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
