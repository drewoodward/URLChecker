import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist',
  manifest: {
    name: 'URLChecker',
    description: 'URL Safety Checker',
    permissions: ['storage'],
    host_permissions: [
      'https://urlchecker-backend-758639415294.us-east4.run.app/*',
    ],
    browser_specific_settings: {
      gecko: {
        id: 'urlchecker@ecu.edu',
        strict_min_version: '109.0',
      },
    },
  },
});
