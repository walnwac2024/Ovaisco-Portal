import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from '../../../utils/api';

/**
 * Register a new biometric device
 */
export const registerBiometric = async (deviceName = 'My Device') => {
    try {
        // 1. Get registration options from server
        const resp = await api.get('/biometric/registration-options');
        const options = resp.data;

        // 2. Start WebAuthn registration
        const attestationResponse = await startRegistration({ optionsJSON: options });

        // 3. Send response to server for verification
        const verifyResp = await api.post('/biometric/verify-registration', {
            ...attestationResponse,
            deviceName
        });

        return verifyResp.data;
    } catch (err) {
        console.error('Biometric registration failed:', err);
        throw err;
    }
};

/**
 * Authenticate using biometric
 */
export const authenticateBiometric = async () => {
    try {
        // 1. Get authentication options from server
        const resp = await api.get('/biometric/authentication-options');
        const options = resp.data;

        // 2. Start WebAuthn authentication
        const assertionResponse = await startAuthentication({ optionsJSON: options });

        // 3. Send response to server for verification
        const verifyResp = await api.post('/biometric/verify-authentication', assertionResponse);

        return verifyResp.data;
    } catch (err) {
        console.error('Biometric authentication failed:', err);
        throw err;
    }
};
