import { useLocalStorage } from '@vueuse/core'

export interface Settings {
  moduleTypeSimple: boolean
  moduleTypeRender: 'badge' | 'circle' | 'none'
  deepDependenciesTree: boolean
  packageDetailsTab: 'dependencies' | 'dependents'
  colorizePackageSize: boolean
  showInstallSizeBadge: boolean
  showFileComposition: boolean
}

export const settings = useLocalStorage<Settings>(
  'node-modules-inspector-settings',
  {
    moduleTypeSimple: false,
    moduleTypeRender: 'badge',
    deepDependenciesTree: true,
    packageDetailsTab: 'dependents',
    colorizePackageSize: true,
    showInstallSizeBadge: true,
    showFileComposition: false,
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
