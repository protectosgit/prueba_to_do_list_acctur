import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todoapp.app',
  appName: 'Todo App',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
