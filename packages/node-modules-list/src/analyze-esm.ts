// Ported and modified from: https://github.com/wooorm/npm-esm-vs-cjs/blob/main/script/crawl.js
// Copyright (c) Titus Wormer <tituswormer@gmail.com>
// MIT Licensed

import type { PackageJson } from 'pkg-types'
import type { PackageModuleType } from './types'

export function analyzePackageJson(pkgJson: PackageJson): PackageModuleType {
  const { exports, main, type } = pkgJson
  let cjs: boolean | undefined
  let esm: boolean | undefined
  let fauxEsm: boolean | undefined

  if (pkgJson.module) {
    fauxEsm = true
  }

  // Check exports map.
  if (exports && typeof exports === 'object') {
    for (const exportId in exports) {
      if (Object.hasOwn(exports, exportId) && typeof exportId === 'string') {
        // @ts-expect-error: indexing on object is fine.
        const value = /** @type {unknown} */ (exports[exportId])
        analyzeThing(value, `${pkgJson.name}#exports`)
      }
    }
  }

  // Explicit `commonjs` set, with a explicit `import` or `.mjs` too.
  if (esm && type === 'commonjs') {
    cjs = true
  }

  // Explicit `module` set, with explicit `require` or `.cjs` too.
  if (cjs && type === 'module') {
    esm = true
  }

  // If there are no explicit exports:
  if (cjs === undefined && esm === undefined) {
    if (type === 'module' || (main && /\.mjs$/.test(main))) {
      esm = true
    }
    else {
      cjs = true
    }
  }

  /** @type {PackageModuleType} */
  const style = esm && cjs ? 'dual' : esm ? 'esm' : fauxEsm ? 'faux' : 'cjs'

  return style

  /**
   * @param {unknown} value
   *   Thing.
   * @param {string} path
   *   Path in `package.json`.
   * @returns {undefined}
   *   Nothing.
   */
  function analyzeThing(value: any, path: string): void {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        const values = /** @type {Array<unknown>} */ (value)
        let index = -1
        while (++index < values.length) {
          analyzeThing(values[index], `${path}[${index}]`)
        }
      }
      else {
        // Cast as indexing on object is fine.
        const record = /** @type {Record<string, unknown>} */ (value)
        let dots = false
        for (const [key, subvalue] of Object.entries(record)) {
          if (key.charAt(0) !== '.')
            break
          analyzeThing(subvalue, `${path}["${key}"]`)
          dots = true
        }

        if (dots)
          return

        let explicit = false
        const conditionImport = Boolean('import' in record && record.import)
        const conditionRequire = Boolean('require' in record && record.require)
        const conditionDefault = Boolean('default' in record && record.default)

        if (conditionImport || conditionRequire) {
          explicit = true
        }

        if (conditionImport || (conditionRequire && conditionDefault)) {
          esm = true
        }

        if (conditionRequire || (conditionImport && conditionDefault)) {
          cjs = true
        }

        const defaults = record.node || record.default

        if (typeof defaults === 'string' && !explicit) {
          if (/\.mjs$/.test(defaults))
            esm = true
          if (/\.cjs$/.test(defaults))
            cjs = true
        }
      }
    }
    else if (typeof value === 'string') {
      if (/\.mjs$/.test(value))
        esm = true
      if (/\.cjs$/.test(value))
        cjs = true
    }
    else if (value === null) {
      // Something explicitly not available,
      // for a particular condition,
      // or before a glob which would allow it.
    }
    else {
      console.error('unknown:', [value], path)
    }
  }
}
