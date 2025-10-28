import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todoapp.app',
  appName: 'Mis tareas',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
