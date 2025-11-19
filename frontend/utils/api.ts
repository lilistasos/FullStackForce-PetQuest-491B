import { Platform } from 'react-native';

// Try to import local config, fall back to defaults if not found
let localConfig: { COMPUTER_IP?: string; PORT?: string; ANDROID_URL?: string; IOS_URL?: string; WEB_URL?: string } | null = null;

try {
  // Attempt to import local config (gitignored)
  localConfig = require('./api.config.local').API_CONFIG;
} catch (error) {
  // Local config doesn't exist, use defaults
  localConfig = null;
}

/**
 * Get the API URL based on platform
 * 
 * Configuration priority:
 * 1. Platform-specific URL from local config (ANDROID_URL, IOS_URL, WEB_URL)
 * 2. COMPUTER_IP from local config
 * 3. Default values (localhost for simulators, 10.0.2.2 for Android emulator)
 * 
 * To set up your local config:
 * 1. Copy frontend/utils/api.config.example.ts to frontend/utils/api.config.local.ts
 * 2. Update api.config.local.ts with your IP address
 * 3. The local config file is gitignored and won't be committed
 */
export const getApiUrl = (): string => {
  const COMPUTER_IP = localConfig?.COMPUTER_IP || '';
  const PORT = localConfig?.PORT || '4000';

  let url: string;

  if (Platform.OS === 'android') {
    // Check for platform-specific override first
    if (localConfig?.ANDROID_URL) {
      url = localConfig.ANDROID_URL;
    } else if (COMPUTER_IP) {
      // Use COMPUTER_IP if provided, otherwise default to emulator IP
      url = `http://${COMPUTER_IP}:${PORT}`;
    } else {
      url = `http://10.0.2.2:${PORT}`; // Android emulator default
    }
  } else if (Platform.OS === 'ios') {
    // Check for platform-specific override first
    if (localConfig?.IOS_URL) {
      url = localConfig.IOS_URL;
    } else if (COMPUTER_IP) {
      // Use COMPUTER_IP if provided, otherwise default to localhost
      url = `http://${COMPUTER_IP}:${PORT}`;
    } else {
      url = `http://localhost:${PORT}`; // iOS simulator default
    }
  } else {
    // Web - use override or default to localhost
    url = localConfig?.WEB_URL || `http://localhost:${PORT}`;
  }

  console.log(`getApiUrl: Platform=${Platform.OS}, URL=${url}`);
  return url;
};

