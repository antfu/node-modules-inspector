import type { FilterOptions } from '../../shared/filters'
import type { NodeModulesInspectorConfig, SettingsOptions } from '../../shared/types'
import { objectMap } from '@antfu/utils'
import { toRaw } from 'vue'
import { FILTERS_SCHEMA } from '../../shared/filters'
import { rawPayload } from '../state/data'
import { filters } from '../state/filters'
import { settings, SETTINGS_DEFAULT } from '../state/settings'

/**
 * The hard schema defaults, independent of any loaded config file. Diffing
 * against these makes the generated config reproduce the current UI state
 * exactly, regardless of an existing `node-modules-inspector.config.ts`.
 */
const FILTERS_DEFAULT = objectMap(FILTERS_SCHEMA, (k, v) => [k, v.default]) as FilterOptions

/**
 * Filter keys that represent transient navigation state rather than
 * persistent configuration, and therefore should not be serialized.
 */
const TRANSIENT_FILTER_KEYS = new Set<keyof FilterOptions>([
  'search',
  'focus',
  'why',
  'compareA',
  'compareB',
])

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b)
    return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length)
      return false
    return a.every((v, i) => isDeepEqual(v, b[i]))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a)
    const bk = Object.keys(b)
    if (ak.length !== bk.length)
      return false
    return ak.every(k => isDeepEqual((a as any)[k], (b as any)[k]))
  }
  return false
}

/**
 * Collect the current filters that differ from their defaults, omitting
 * transient navigation state.
 */
export function getNonDefaultFilters(): Partial<FilterOptions> {
  const state = toRaw(filters.state) as FilterOptions
  const result: Partial<FilterOptions> = {}
  for (const key of Object.keys(state) as (keyof FilterOptions)[]) {
    if (TRANSIENT_FILTER_KEYS.has(key))
      continue
    if (!isDeepEqual(state[key], FILTERS_DEFAULT[key]))
      result[key] = structuredClone(toRaw(state[key])) as any
  }
  return result
}

/**
 * Collect the current settings that differ from their defaults.
 */
export function getNonDefaultSettings(): Partial<SettingsOptions> {
  const current = settings.value
  const result: Partial<SettingsOptions> = {}
  for (const key of Object.keys(SETTINGS_DEFAULT) as (keyof SettingsOptions)[]) {
    if (!isDeepEqual(current[key], SETTINGS_DEFAULT[key]))
      result[key] = structuredClone(toRaw(current[key])) as any
  }
  return result
}

/**
 * Keep only the string entries of a config array (function-based matchers
 * cannot be serialized and are already stripped when the config is sent to
 * the frontend).
 */
function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value))
    return undefined
  return value.filter((v): v is string => typeof v === 'string')
}

const IDENTIFIER_RE = /^[a-z_$][\w$]*$/i

function serialize(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent)
  const padInner = '  '.repeat(indent + 1)

  if (Array.isArray(value)) {
    if (value.length === 0)
      return '[]'
    const items = value.map(v => `${padInner}${serialize(v, indent + 1)},`).join('\n')
    return `[\n${items}\n${pad}]`
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0)
      return '{}'
    const items = keys.map((k) => {
      const key = IDENTIFIER_RE.test(k) ? k : JSON.stringify(k)
      return `${padInner}${key}: ${serialize((value as any)[k], indent + 1)},`
    }).join('\n')
    return `{\n${items}\n${pad}}`
  }

  if (typeof value === 'string')
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`

  return String(value)
}

/**
 * Generate the source of a `node-modules-inspector.config.ts` file that
 * captures the current filters and settings as defaults, merged on top of the
 * existing config so its other fields (name, publint, excludes, ...) are
 * preserved.
 */
export function generateConfigFile(): string {
  const existing = (rawPayload.value?.config ?? {}) as NodeModulesInspectorConfig
  const config: NodeModulesInspectorConfig = {}

  // Preserve non-filter/settings fields from the existing config.
  if (existing.name != null)
    config.name = existing.name
  if (existing.fetchNpmMeta != null)
    config.fetchNpmMeta = existing.fetchNpmMeta
  if (existing.publint != null)
    config.publint = existing.publint
  const excludePackages = toStringArray(existing.excludePackages)
  if (excludePackages?.length)
    config.excludePackages = excludePackages
  const excludeDependenciesOf = toStringArray(existing.excludeDependenciesOf)
  if (excludeDependenciesOf?.length)
    config.excludeDependenciesOf = excludeDependenciesOf

  // The current filter/settings state already folds in the existing config's
  // defaults, so diffing against the hard defaults yields the fully-merged
  // result (existing config values + the user's changes, including resets).
  const defaultFilters = getNonDefaultFilters()
  if (Object.keys(defaultFilters).length)
    config.defaultFilters = defaultFilters

  const defaultSettings = getNonDefaultSettings()
  if (Object.keys(defaultSettings).length)
    config.defaultSettings = defaultSettings

  return [
    `import { defineConfig } from 'node-modules-inspector'`,
    '',
    `export default defineConfig(${serialize(config, 0)})`,
    '',
  ].join('\n')
}
