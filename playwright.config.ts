import { defineConfig } from '@playwright/test'

const deployedURL = process.env.ARCVELD_E2E_URL
const baseURL = deployedURL || 'http://127.0.0.1:4173/ArcVeld/'
const browser = process.env.ARCVELD_BROWSER

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL,
    browserName: browser === 'firefox' ? 'firefox' : 'chromium',
    channel: browser === 'firefox' ? undefined : browser || undefined,
  },
  webServer: deployedURL ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --base /ArcVeld/',
    url: baseURL,
    timeout: 30_000,
  },
})
