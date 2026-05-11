import { expect, test } from '@playwright/test'

// "Hosted webcontainer mode" = `pnpm wc:build` output, deployed at
// node-modules.dev. The page shows a `pnpm install` landing prompt and only
// works under COOP/COEP headers (required by the WebContainer runtime).
//
// We verify the static landing renders correctly and that the deployment
// headers Netlify sets in production are present. We do NOT actually boot a
// WebContainer in tests — that requires a real browser tab and a few seconds
// of downloads, which is out of scope for a smoke test.

test.describe('hosted webcontainer mode', () => {
  test('serves the WebContainer landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Node Modules Inspector/)

    // Landing renders the `pnpm install <input>` prompt.
    await expect(page.getByText('pnpm', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('install', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Enter package names')).toBeVisible()

    // The "WebContainer" link appears in the explanatory copy.
    await expect(page.getByRole('link', { name: 'WebContainer' })).toBeVisible()
  })

  test('responds with COOP/COEP headers required by WebContainer', async ({ request }) => {
    const res = await request.get('/index.html')
    expect(res.ok()).toBe(true)
    expect(res.headers()['cross-origin-embedder-policy']).toBe('require-corp')
    expect(res.headers()['cross-origin-opener-policy']).toBe('same-origin')
  })

  test('does not auto-connect to any backend on first paint', async ({ page }) => {
    await page.goto('/')
    // No nav rail until a backend is registered (which only happens after the
    // user submits the install form). The landing input is the canonical
    // first-paint affordance.
    await expect(page.getByPlaceholder('Enter package names')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('a[href^="/grid"]')).toHaveCount(0)
  })
})
