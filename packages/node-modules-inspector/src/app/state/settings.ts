import { useLocalStorage } from '@vueuse/core'

export interface Settings {
  moduleTypeSimple: boolean
  moduleTypeHide: boolean
  deepDependenciesTree: boolean
  deepDependentsTree: boolean
}

export const settings = useLocalStorage<Settings>(
  'node-modules-inspector-settings',
  {
    moduleTypeSimple: false,
    moduleTypeHide: false,
    deepDependenciesTree: true,
    deepDependentsTree: true,
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
