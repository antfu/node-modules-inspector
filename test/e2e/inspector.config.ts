import { defineConfig } from '../../packages/node-modules-inspector/src/node/index'

// E2E builds shouldn't depend on the live npm registry: the static export
// runs against the workspace root (~2000 transitive deps) and a cold-cache
// `fetchNpmMeta` blows past Playwright's 10-minute webServer timeout in CI.
// Publint is also skipped — the e2e specs don't read either field, they
// just verify connection metadata, the rpc dump manifest, and that the SPA
// hydrates and navigates.
export default defineConfig({
  excludeDependenciesOf: [
    'eslint',
  ],
  excludePackages: [
    '@pnpm/list',
    '@pnpm/types',
  ],
  defaultFilters: {
    excludes: [
      'webpack',
    ],
  },
  fetchNpmMeta: false,
  publint: false,
})
