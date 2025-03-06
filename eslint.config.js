// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './packages/node-modules-inspector/src/.nuxt/eslint.config.mjs'

export default antfu({
  pnpmCatalogs: true,
})
  .append(nuxt())
  .append({
    files: ['packages/node-modules-inspector/src/node/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  })
