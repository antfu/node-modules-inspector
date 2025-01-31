import type { PackageModuleType } from 'node-modules-tools'
import { reactive } from 'vue'

export interface FilterOptions {
  search: string
  module: null | PackageModuleType
  license: null | string
}

export const filters = reactive<FilterOptions>({
  search: '',
  module: null,
  license: null,
})
