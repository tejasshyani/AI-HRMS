import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fingoal.hrms',
  appName: 'FinGoal HRMS',
  webDir: 'dist/fingoal-hrms/browser',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
