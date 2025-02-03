import { useLocalStorage } from '@vueuse/core'

export interface Settings {
  moduleTypeSimple: boolean
  moduleTypeRender: 'badge' | 'circle' | 'none'
  deepDependenciesTree: boolean
  packageDetailsTab: 'dependencies' | 'dependents'
}

export const settings = useLocalStorage<Settings>(
  'node-modules-inspector-settings',
  {
    moduleTypeSimple: false,
    moduleTypeRender: 'badge',
    deepDependenciesTree: true,
    packageDetailsTab: 'dependents',
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
