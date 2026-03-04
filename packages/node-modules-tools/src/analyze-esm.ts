// Ported and modified from:
// - https://github.com/wooorm/npm-esm-vs-cjs/blob/main/script/crawl.js
// - https://github.com/npmx-dev/npmx.dev/blob/main/shared/utils/package-analysis.ts

import type { PackageJson } from 'pkg-types'
import type { PackageModuleType } from './types'

interface ExportsAnalysis {
  hasImport: boolean
  hasRequire: boolean
  hasModule: boolean
}

/**
 * Recursively analyze exports field for module format indicators
 */
function analyzeExports(exports: unknown, depth = 0): ExportsAnalysis {
  const result: ExportsAnalysis = {
    hasImport: false,
    hasRequire: false,
    hasModule: false,
  }

  if (depth > 10)
    return result
  if (exports == null)
    return result

  if (typeof exports === 'string') {
    if (exports.endsWith('.mjs') || exports.endsWith('.mts'))
      result.hasImport = true
    else if (exports.endsWith('.cjs') || exports.endsWith('.cts'))
      result.hasRequire = true
    return result
  }

  if (Array.isArray(exports)) {
    for (const item of exports)
      mergeAnalysis(result, analyzeExports(item, depth + 1))
    return result
  }

  if (typeof exports === 'object') {
    for (const [key, value] of Object.entries(exports as Record<string, unknown>)) {
      if (key === 'import')
        result.hasImport = true
      else if (key === 'require')
        result.hasRequire = true
      else if (key === 'module')
        result.hasModule = true

      mergeAnalysis(result, analyzeExports(value, depth + 1))
    }
  }

  return result
}

function mergeAnalysis(target: ExportsAnalysis, source: ExportsAnalysis): void {
  target.hasImport = target.hasImport || source.hasImport
  target.hasRequire = target.hasRequire || source.hasRequire
  target.hasModule = target.hasModule || source.hasModule
}

export function analyzePackageModuleType(pkgJson: PackageJson): PackageModuleType {
  // @types/ packages are always type-only
  if (pkgJson.name?.startsWith('@types/'))
    return 'dts'

  const hasExports = pkgJson.exports != null
  const hasModule = !!pkgJson.module
  const hasMain = !!pkgJson.main
  const isTypeModule = pkgJson.type === 'module'

  // Check exports field for module format indicators
  if (hasExports && pkgJson.exports) {
    const exportInfo = analyzeExports(pkgJson.exports)

    if (exportInfo.hasImport && exportInfo.hasRequire)
      return 'dual'

    if (exportInfo.hasImport || exportInfo.hasModule) {
      if (hasMain && !isTypeModule)
        return 'dual'
      return 'esm'
    }

    if (exportInfo.hasRequire) {
      if (hasModule)
        return 'dual'
      return 'cjs'
    }

    // exports exists but no clear import/require/module conditions
    // Fall through to legacy detection
  }

  // Legacy detection (no exports or exports without clear conditions)
  if (hasModule && hasMain) {
    const mainIsCJS = pkgJson.main?.endsWith('.cjs')
      || (pkgJson.main?.endsWith('.js') && !isTypeModule)
    return mainIsCJS ? 'faux' : 'esm'
  }

  if (hasModule)
    return 'faux'

  if (isTypeModule || (hasMain && pkgJson.main?.endsWith('.mjs')))
    return 'esm'

  if (hasMain)
    return 'cjs'

  // Type-only packages (no main, no exports, but has types)
  if (pkgJson.types || pkgJson.typings)
    return 'dts'

  return 'cjs'
}
