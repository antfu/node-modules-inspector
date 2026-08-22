import type { SettingsOptions } from '../../shared/types'
import { useLocalStorage } from '@vueuse/core'

export const SETTINGS_DEFAULT: SettingsOptions = {
  graphRender: 'normal',
  moduleTypeSimple: false,
  moduleTypeRender: 'badge',
  deepDependenciesTree: true,
  dependenciesGroupBy: 'none',
  packageDetailsTab: 'dependents',
  colorizePackageSize: true,
  showInstallSizeBadge: true,
  showPublishTimeBadge: false,
  showProvenanceBadge: 'present',
  showFileComposition: false,
  showDependencySourceBadge: 'dev',
  showPublintMessages: false,
  showMaintainerActions: false,
  showThirdPartyServices: false,
  treatFauxAsESM: false,
  collapseSidepanel: false,
  chartAnimation: true,
  preferNpmx: true,
}

export const settings = useLocalStorage<SettingsOptions>(
  'node-modules-inspector-settings',
  { ...SETTINGS_DEFAULT },
  {
    deep: true,
    mergeDefaults: true,
  },
)
