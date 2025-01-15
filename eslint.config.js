// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu()
  .append(nuxt())
  .append({
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  })
