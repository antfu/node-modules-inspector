import type { PackageModuleType } from 'node-modules-tools'

export interface FilterOptions {
  'search': string
  'modules': null | PackageModuleType[]
  'focus': null | string[]
  'why': null | string[]
  'excludes': null | string[]
  'exclude-dts': boolean
  'exclude-private': boolean
  'exclude-workspace': boolean
  'source-type': null | 'prod' | 'dev'

  'compare-a': null | string[]
  'compare-b': null | string[]
}

export interface FilterSchema<Type> {
  type: StringConstructor | ArrayConstructor | BooleanConstructor
  default: Type
  category: 'select' | 'exclude' | 'compare'
}

export const FILTERS_SCHEMA: {
  [x in keyof FilterOptions]: FilterSchema<FilterOptions[x]>
} = {
  'search': { type: String, default: '', category: 'select' },
  'modules': { type: Array, default: null, category: 'select' },
  'focus': { type: Array, default: null, category: 'select' },
  'why': { type: Array, default: null, category: 'select' },
  'source-type': { type: String, default: null, category: 'select' },

  // Compare
  'compare-a': { type: Array, default: [], category: 'compare' },
  'compare-b': { type: Array, default: [], category: 'compare' },

  // Excludes
  'excludes': { type: Array, default: null, category: 'exclude' },
  'exclude-dts': { type: Boolean, default: true, category: 'exclude' },
  'exclude-private': { type: Boolean, default: false, category: 'exclude' },
  'exclude-workspace': { type: Boolean, default: import.meta.env.BACKEND === 'webcontainer', category: 'exclude' },
}
