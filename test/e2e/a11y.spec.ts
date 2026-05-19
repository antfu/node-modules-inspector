import type { Page } from '@playwright/test'
import type { AxeResults } from 'axe-core'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Runs against the static build server (port 13002) — deterministic rendered DOM,
// no websocket loading races. See `playwright.config.ts`.

type Mode = 'light' | 'dark'

const MODES: Mode[] = ['light', 'dark']

// The five nav-rail routes (see `packages/node-modules-inspector/src/app/components/panel/Nav.vue`).
const PAGES = ['/grid/depth', '/graph', '/chart', '/report', '/compare'] as const

const navLink = (href: string) => `a[href^="${href}"]`

async function setMode(page: Page, mode: Mode): Promise<void> {
  // VueUse `useDark` reads from `vueuse-color-scheme` by default.
  await page.addInitScript((m) => {
    try {
      localStorage.setItem('vueuse-color-scheme', m)
    }
    catch {}
  }, mode)
}

async function gotoAndReady(page: Page, path: string): Promise<void> {
  await page.goto(path)
  // Nav rail mounts only after the static backend resolves the rpc dump.
  await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })
}

async function ensureMode(page: Page, mode: Mode): Promise<void> {
  await expect.poll(async () => page.evaluate(
    m => document.documentElement.classList.contains('dark') === (m === 'dark'),
    mode,
  )).toBe(true)
}

async function scanContrast(page: Page): Promise<AxeResults> {
  return new AxeBuilder({ page })
    .withRules(['color-contrast'])
    // Shiki-highlighted code uses intentional token palettes.
    .exclude('.shiki')
    // Escape hatch for known-decorative content (graph/chart SVGs etc).
    .exclude('[data-a11y-skip]')
    // xterm renders to canvas with injected styles we don't control.
    .exclude('.xterm')
    .exclude('.xterm-rows')
    .analyze()
}

function formatViolations(results: AxeResults): string {
  return JSON.stringify(
    results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map(n => ({
        target: n.target,
        failureSummary: n.failureSummary,
      })),
    })),
    null,
    2,
  )
}

for (const mode of MODES) {
  for (const path of PAGES) {
    test(`a11y: ${path} has no color-contrast violations in ${mode} mode`, async ({ page }) => {
      await setMode(page, mode)
      await gotoAndReady(page, path)
      await ensureMode(page, mode)

      const results = await scanContrast(page)
      expect.soft(results.violations, formatViolations(results)).toEqual([])
    })
  }

  test(`a11y: settings panel has no color-contrast violations in ${mode} mode`, async ({ page }) => {
    await setMode(page, mode)
    await gotoAndReady(page, '/grid/depth')
    await ensureMode(page, mode)

    await page.locator('button[title="Settings"]').click()
    // PanelSettings renders OptionItem rows. Wait for the first known label.
    await expect(page.getByText('Simplify module types')).toBeVisible()

    const results = await scanContrast(page)
    expect.soft(results.violations, formatViolations(results)).toEqual([])
  })

  test(`a11y: filters panel has no color-contrast violations in ${mode} mode`, async ({ page }) => {
    await setMode(page, mode)
    await gotoAndReady(page, '/grid/depth')
    await ensureMode(page, mode)

    await page.locator('button[title="Filters"]').click()
    await expect(page.getByText(/Filters/i).first()).toBeVisible()

    const results = await scanContrast(page)
    expect.soft(results.violations, formatViolations(results)).toEqual([])
  })

  test(`a11y: package details has no color-contrast violations in ${mode} mode`, async ({ page }) => {
    await setMode(page, mode)
    await gotoAndReady(page, '/grid/depth')
    await ensureMode(page, mode)

    // Grid items render UiPackageBorder as `<button class="... border rounded-lg bg-base">`.
    // Pick the first one inside the first open <details> group.
    const item = page.locator('details[open] button.rounded-lg').first()
    await item.click()
    // Selecting a package mounts PanelPackageDetails inside the side panel.
    await expect(page.locator('details[open] button.rounded-lg.ring-3, details[open] button.rounded-lg[class*="ring-primary"]').first()).toBeVisible()

    const results = await scanContrast(page)
    expect.soft(results.violations, formatViolations(results)).toEqual([])
  })
}
