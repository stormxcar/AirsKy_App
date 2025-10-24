import Constants from 'expo-constants';

/**
 * Retrieves environment variables from the app's configuration (app.config.js).
 * The `extra` field is made available here via expo-constants.
 */
function getEnvVars() {
    // ?.extra ?? {} ensures we don't crash if extra is not defined
    return Constants.expoConfig?.extra ?? {};
}

const { API_BASE_URL } = getEnvVars() as { API_BASE_URL?: string };

export default { API_BASE_URL };
