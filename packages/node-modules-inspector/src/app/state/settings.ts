import { useLocalStorage } from '@vueuse/core'

export interface Settings {
  moduleTypeSimple: boolean
  moduleTypeHide: boolean
  moduleTypeDot: boolean
  deepDependenciesTree: boolean
  packageDetailsTab: 'dependencies' | 'dependents'
}

export const settings = useLocalStorage<Settings>(
  'node-modules-inspector-settings',
  {
    moduleTypeSimple: false,
    moduleTypeHide: false,
    moduleTypeDot: true,
    deepDependenciesTree: true,
    packageDetailsTab: 'dependents',
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
