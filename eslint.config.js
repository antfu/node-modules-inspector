// @ts-check
import antfu from '@antfu/eslint-config'
import nuxt from './src/.nuxt/eslint.config.mjs'

export default antfu()
  .append(nuxt())
  .append({
    files: ['src/node/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  })
