import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.groceryonwheel.com',
  appName: 'GroceryOnWheel',
  webDir: 'build',
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#ffffff'
  },
  server: {
    cleartext: true // allows HTTP if needed (e.g., for testing or local APIs)
  },
  plugins: {
  CameraPreview: {
    parent: 'camera-container',
    className: 'cameraPreview',
    toBack: false, // or true if you set transparency
  }
}
};

export default config;
