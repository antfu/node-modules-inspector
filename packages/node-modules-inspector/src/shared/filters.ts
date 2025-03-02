import type { PackageModuleType } from 'node-modules-tools'

export interface FilterOptions {
  search: string
  modules: null | PackageModuleType[]
  focus: null | string[]
  why: null | string[]
  excludes: null | string[]
  excludeDts: boolean
  excludePrivate: boolean
  excludeWorkspace: boolean
  sourceType: null | 'prod' | 'dev'
  depths: null | (number | string)[]

  compareA: null | string[]
  compareB: null | string[]
}

export interface FilterSchema<Type> {
  type: StringConstructor | ArrayConstructor | BooleanConstructor
  default: Type
  category: 'select' | 'exclude' | 'compare'
}

export const FILTERS_SCHEMA: {
  [x in keyof FilterOptions]: FilterSchema<FilterOptions[x]>
} = {
  search: { type: String, default: '', category: 'select' },
  modules: { type: Array, default: null, category: 'select' },
  focus: { type: Array, default: null, category: 'select' },
  why: { type: Array, default: null, category: 'select' },
  sourceType: { type: String, default: null, category: 'select' },
  depths: { type: Array, default: null, category: 'select' },

  // Compare
  compareA: { type: Array, default: [], category: 'compare' },
  compareB: { type: Array, default: [], category: 'compare' },

  // Excludes
  excludes: { type: Array, default: null, category: 'exclude' },
  excludeDts: { type: Boolean, default: true, category: 'exclude' },
  excludePrivate: { type: Boolean, default: false, category: 'exclude' },
  excludeWorkspace: { type: Boolean, default: import.meta.env.BACKEND === 'webcontainer', category: 'exclude' },
}
