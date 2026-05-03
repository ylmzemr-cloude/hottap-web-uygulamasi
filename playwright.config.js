import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi',
    headless: false,
    slowMo: 500,
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [['list']],
});
