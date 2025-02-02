import { useLocalStorage } from '@vueuse/core'

export interface Settings {
  moduleTypeSimple: boolean
  moduleTypeHide: boolean
  deepDependenciesTree: boolean
  packageDetailsTab: 'dependencies' | 'dependents'
}

export const settings = useLocalStorage<Settings>(
  'node-modules-inspector-settings',
  {
    moduleTypeSimple: false,
    moduleTypeHide: false,
    deepDependenciesTree: true,
    packageDetailsTab: 'dependents',
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
