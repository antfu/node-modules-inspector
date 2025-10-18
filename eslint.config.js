// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './packages/node-modules-inspector/src/.nuxt/eslint.config.mjs'

export default antfu({
  pnpm: true,
})
  .append(nuxt())
  .append({
    files: ['packages/node-modules-inspector/src/node/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  })
  .append({
    files: ['packages/node-modules-tools/test/bun/fixtures/**/package.json'],
    rules: {
      'pnpm/json-valid-catalog': 'off',
    },
  })
  .append({
    files: ['pnpm-workspace.yaml'],
    name: 'antfu/yaml/pnpm-workspace',
    rules: {
      'yaml/sort-keys': [
        'error',
        {
          order: [
            'packages',
            'overrides',
            'patchedDependencies',
            'hoistPattern',
            'catalog',
            'catalogs',

            'allowedDeprecatedVersions',
            'allowNonAppliedPatches',
            'configDependencies',
            'ignoredBuiltDependencies',
            'ignoredOptionalDependencies',
            'neverBuiltDependencies',
            'onlyBuiltDependencies',
            'onlyBuiltDependenciesFile',
            'packageExtensions',
            'peerDependencyRules',
            'supportedArchitectures',
          ],
          pathPattern: '^$',
        },
        {
          order: { type: 'asc' },
          pathPattern: '.*',
        },
      ],
    },
  })
