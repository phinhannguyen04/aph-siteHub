import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:18111',
    headless: true,
    launchOptions: {
      executablePath: process.env.SITEHUB_TEST_BROWSER,
    },
  },
  webServer: {
    command: 'bun run start --port 18111',
    url: 'http://127.0.0.1:18111',
    reuseExistingServer: false,
  },
  outputDir: 'test-results',
  reporter: 'list',
})
