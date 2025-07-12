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
  // server:{
  //   url:"http://192.168.1.5:3000",
  //   cleartext: true,
  // },
  plugins: {
  CameraPreview: {
    parent: 'camera-container',
    className: 'cameraPreview',
    toBack: false, // or true if you set transparency
  }
}
};

export default config;
