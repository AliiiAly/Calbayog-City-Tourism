import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calbayog.tourism',
  appName: 'CalbayogTourism',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
