import type { SettingsOptions } from '~~/shared/types'
import { useLocalStorage } from '@vueuse/core'

export const settings = useLocalStorage<SettingsOptions>(
  'node-modules-inspector-settings',
  {
    moduleTypeSimple: false,
    moduleTypeRender: 'badge',
    deepDependenciesTree: true,
    packageDetailsTab: 'dependents',
    colorizePackageSize: true,
    showInstallSizeBadge: true,
    showPublishTimeBadge: false,
    showFileComposition: false,
    treatFauxAsESM: false,
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
