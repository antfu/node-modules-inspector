import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

// "Instant mode" of the hosted web build (`pnpm web:build` output): the
// dependency graph is resolved purely from npm-registry metadata in the
// browser — no WebContainer boot. We intercept all registry traffic with
// fixtures so the test is deterministic and offline.

interface FixtureVersion {
  dependencies?: Record<string, string>
  unpackedSize?: number
  manifest?: Record<string, any>
}

const FIXTURES: Record<string, { versions: Record<string, FixtureVersion> }> = {
  'demo-lib': {
    versions: {
      '1.2.0': {
        dependencies: { 'demo-dep': '^2.0.0' },
        unpackedSize: 4321,
        manifest: { type: 'module', license: 'MIT', description: 'Demo library' },
      },
    },
  },
  'demo-dep': {
    versions: {
      '2.5.0': {
        unpackedSize: 1234,
        manifest: { license: 'MIT', description: 'Demo dependency' },
      },
    },
  },
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  // The page is cross-origin isolated (COEP: require-corp) — responses must be CORS-approved.
  'access-control-allow-origin': '*',
}

async function mockRegistry(page: Page): Promise<void> {
  await page.route('https://registry.npmjs.org/**', async (route) => {
    const url = new URL(route.request().url())

    // Security advisories bulk endpoint
    if (url.pathname.startsWith('/-/')) {
      return route.fulfill({ headers: JSON_HEADERS, body: '{}' })
    }

    const segments = url.pathname.replace(/^\//, '').split('/').map(decodeURIComponent)
    const name = segments[0]!.startsWith('@') && segments.length > 1 ? `${segments[0]}/${segments[1]}` : segments[0]!
    const rest = segments.slice(name.includes('/') ? 2 : 1)
    const fixture = FIXTURES[name]
    if (!fixture)
      return route.fulfill({ status: 404, headers: JSON_HEADERS, body: '{"error":"not found"}' })

    if (rest.length === 0) {
      // Abbreviated packument
      const versions = Object.fromEntries(Object.entries(fixture.versions).map(([version, v]) => [version, {
        name,
        version,
        dependencies: v.dependencies,
        dist: { unpackedSize: v.unpackedSize },
      }]))
      const latest = Object.keys(fixture.versions).at(-1)!
      return route.fulfill({
        headers: JSON_HEADERS,
        body: JSON.stringify({ 'name': name, 'dist-tags': { latest }, versions }),
      })
    }

    // Full version manifest
    const v = fixture.versions[rest[0]!]
    if (!v)
      return route.fulfill({ status: 404, headers: JSON_HEADERS, body: '{"error":"not found"}' })
    return route.fulfill({
      headers: JSON_HEADERS,
      body: JSON.stringify({ name, version: rest[0], dependencies: v.dependencies, ...v.manifest }),
    })
  })

  // npm meta layer (fast-npm-meta) — fail fast, the app tolerates missing meta
  await page.route('https://npm.antfu.dev/**', route =>
    route.fulfill({ status: 500, headers: JSON_HEADERS, body: '{}' }))
}

test.describe('hosted instant mode', () => {
  test('landing defaults to Instant mode with a Sandbox toggle', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Registry Query', exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Sandbox Install' })).toBeVisible()
    await expect(page.getByPlaceholder('Enter package names')).toBeVisible()

    // Instant mode explains the registry resolution
    await page.getByPlaceholder('Enter package names').fill('demo-lib')
    await expect(page.getByRole('link', { name: 'npm registry' })).toBeVisible()

    // Switching to Sandbox Install shows the pnpm prompt copy
    await page.getByRole('button', { name: 'Sandbox Install' }).click()
    await expect(page.getByText('pnpm', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'WebContainer' })).toBeVisible()
  })

  test('resolves a dependency graph from the registry without a WebContainer', async ({ page }) => {
    await mockRegistry(page)

    await page.goto('/#install=demo-lib')
    // Auto-runs from the query param; the graph loads without any install
    await expect(page.locator('a[href^="/grid"]').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('demo-lib').locator('visible=true').first()).toBeVisible()
    await expect(page.getByText('demo-dep').locator('visible=true').first()).toBeVisible()
  })

  test('shows the approximate badge in the overview panel', async ({ page }) => {
    await mockRegistry(page)

    await page.goto('/#install=demo-lib')
    await expect(page.locator('a[href^="/grid"]').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('approximate', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'npm registry' })).toBeVisible()
  })

  test('shows an error on the landing when the query cannot be resolved', async ({ page }) => {
    await mockRegistry(page)

    // `ghost-pkg` is not in the fixtures, so the registry returns 404 for it.
    await page.goto('/#install=ghost-pkg')

    // The landing stays put and surfaces the failure — no empty graph.
    await expect(page.getByText('Failed to Resolve Dependencies')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Registry Query', exact: true })).toBeVisible()
    await expect(page.locator('a[href^="/grid"]')).toHaveCount(0)
  })

  test('browser Back returns to the landing after a query', async ({ page }) => {
    await mockRegistry(page)

    await page.goto('/#install=demo-lib')
    await expect(page.locator('a[href^="/grid"]').first()).toBeVisible({ timeout: 30_000 })
    // Navigating into the inspector pushed a history entry, not a replace.
    await expect(page).toHaveURL(/\/grid\//)

    await page.goBack()
    await expect(page.getByRole('button', { name: 'Registry Query', exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Enter package names')).toBeVisible()
  })
})
