/**
 * API Configuration Example
 * 
 * Copy this file to api.config.local.ts and update with your local settings.
 * The local config file is gitignored and won't be committed.
 */

export const API_CONFIG = {
  // Your computer's IP address for physical device testing
  // Leave empty to use defaults (localhost for simulators, 10.0.2.2 for Android emulator)
  COMPUTER_IP: '',
  
  // Backend server port
  PORT: '4000',
  
  // Override URLs for specific platforms (optional)
  // If not specified, will use COMPUTER_IP or defaults
  ANDROID_URL: '', // e.g., 'http://10.0.2.2:4000' for emulator or 'http://192.168.4.27:4000' for device
  IOS_URL: '',     // e.g., 'http://localhost:4000' for simulator or 'http://192.168.4.27:4000' for device
  WEB_URL: 'http://localhost:4000',
};

