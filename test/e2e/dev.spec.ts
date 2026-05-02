import { expect, test } from '@playwright/test'

// "Dev mode" = the live `node-modules-inspector` CLI. The HTTP server hosts the
// built dist and a websocket backend that streams the current repo's
// node_modules. The default route redirects to /grid/depth.

// floating-vue's `v-tooltip` strips the native `title` attribute, so we locate
// the nav rail by href instead — it's the only stable handle in production.
const navLink = (href: string) => `a[href^="${href}"]`

test.describe('dev mode (CLI + websocket backend)', () => {
  test('serves the inspector and connects to the live backend', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/grid\//, { timeout: 30_000 })
    await expect(page).toHaveTitle(/Node Modules Inspector/)

    // Nav rail mounts only after the websocket backend is connected and the
    // payload has loaded.
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })
  })

  test('exposes the dev backend connection meta', async ({ request }) => {
    const res = await request.get('/.connection.json')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body).toHaveProperty('websocket')
    expect(body.backend).toBe('websocket')
  })

  test('navigates between views', async ({ page }) => {
    await page.goto('/grid/depth')
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })

    await page.locator(navLink('/graph')).first().click()
    await expect(page).toHaveURL(/\/graph/)

    await page.locator(navLink('/report')).first().click()
    await expect(page).toHaveURL(/\/report/)

    await page.locator(navLink('/chart')).first().click()
    await expect(page).toHaveURL(/\/chart/)
  })
})
