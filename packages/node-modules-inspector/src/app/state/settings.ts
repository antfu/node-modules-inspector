import type { SettingsOptions } from '../../shared/types'
import { useLocalStorage } from '@vueuse/core'

export const settings = useLocalStorage<SettingsOptions>(
  'node-modules-inspector-settings',
  {
    graphRender: 'normal',
    moduleTypeSimple: false,
    moduleTypeRender: 'badge',
    deepDependenciesTree: true,
    packageDetailsTab: 'dependents',
    colorizePackageSize: true,
    showInstallSizeBadge: true,
    showPublishTimeBadge: false,
    showFileComposition: false,
    showDependencySourceBadge: 'dev',
    showPublintMessages: false,
    treatFauxAsESM: false,
    chartColoringMode: 'spectrum',
  },
  {
    deep: true,
    mergeDefaults: true,
  },
)
