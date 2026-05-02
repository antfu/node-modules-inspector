import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const PORT_DEV = 13001
const PORT_BUILD = 13002
const PORT_WC = 13003

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './test/e2e',
  outputDir: './test/e2e/.results',
  // The orchestrator builds shared fixtures sequentially; tests touching the
  // dev CLI's websocket backend are also stateful, so keep things serial.
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['github']] : 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },

  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'dev',
      testMatch: /dev\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${PORT_DEV}`,
      },
    },
    {
      name: 'build',
      testMatch: /build\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${PORT_BUILD}`,
      },
    },
    {
      name: 'webcontainer',
      testMatch: /webcontainer\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${PORT_WC}`,
      },
    },
  ],

  // A single orchestrator process: it builds the build/webcontainer fixtures
  // (skipping when present) and then runs all three servers under one PID.
  // Playwright's `webServer` start ordering vs `globalSetup` can't be relied
  // on, so consolidating into one command is the only race-free shape.
  webServer: {
    command: 'node test/e2e/utils/orchestrate.mjs',
    url: `http://127.0.0.1:${PORT_DEV}/.connection.json`,
    reuseExistingServer: !isCI,
    // Cold start in CI has to do `pnpm wc:build`, `pnpm build`, plus the
    // static export (which fetches npm meta for every dep) — together this
    // can take 5+ minutes on a fresh runner.
    timeout: 600_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      E2E_PORT_DEV: String(PORT_DEV),
      E2E_PORT_BUILD: String(PORT_BUILD),
      E2E_PORT_WC: String(PORT_WC),
    },
  },
})
