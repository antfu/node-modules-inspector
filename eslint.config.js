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
    files: ['packages/node-modules-tools/test/*/fixtures/**/package.json'],
    rules: {
      'pnpm/json-enforce-catalog': 'off',
      'pnpm/json-valid-catalog': 'off',
    },
  })
  .append({
    files: ['test/e2e/**/*.{ts,mjs,js}'],
    rules: {
      'no-console': 'off',
      'antfu/no-top-level-await': 'off',
    },
  })
