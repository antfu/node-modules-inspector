import { expect, test } from '@playwright/test'

// "Build mode" = the static export produced by `node-modules-inspector build`.
// No backend; data is baked into api/rpc-dump.json and api/metadata.json
// reports `backend: 'static'`. Served from a plain static file server.

const navLink = (href: string) => `a[href^="${href}"]`

test.describe('build mode (static export)', () => {
  test('serves the static landing and exposes a static connection meta', async ({ page, request }) => {
    const res = await request.get('/.connection.json')
    expect(res.ok()).toBe(true)
    expect(await res.json()).toMatchObject({ backend: 'static' })

    const manifest = await request.get('/.rpc-dump/index.json')
    expect(manifest.ok()).toBe(true)
    const manifestBody = await manifest.json()
    expect(manifestBody).toHaveProperty('nmi:get-payload')

    await page.goto('/')
    await expect(page).toHaveTitle(/Node Modules Inspector/)
  })

  test('renders the inspector UI from the prebuilt RPC dump', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/grid\//, { timeout: 30_000 })
    // Nav rail mounts only after the static backend resolves the rpc dump.
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })
  })

  test('navigates between views without a backend round-trip', async ({ page }) => {
    await page.goto('/grid/depth')
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })

    await page.locator(navLink('/graph')).first().click()
    await expect(page).toHaveURL(/\/graph/)

    await page.locator(navLink('/chart')).first().click()
    await expect(page).toHaveURL(/\/chart/)
  })
})
