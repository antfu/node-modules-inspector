import { useLocalStorage } from '@vueuse/core'

export interface Settings {
  deepDependenciesTree: boolean
  deepDependentsTree: boolean
}

export const settings = useLocalStorage<Settings>(
  'node-modules-inspector-settings',
  {
    deepDependenciesTree: true,
    deepDependentsTree: true,
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
