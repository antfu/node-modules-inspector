<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app/composables/router'
import { NuxtLink } from '#components'
import ReportDeprecated from '../../components/report/Deprecated.vue'
import ReportEngines from '../../components/report/Engines.vue'
import ReportFunding from '../../components/report/Funding.vue'
import ReportInstallSize from '../../components/report/InstallSize.vue'
import ReportLicenses from '../../components/report/Licenses.vue'
import ReportMaintainerActions from '../../components/report/MaintainerActions.vue'
import ReportMultipleVersions from '../../components/report/MultipleVersions.vue'
import ReportPublishTime from '../../components/report/PublishTime.vue'
import ReportTransitiveDeps from '../../components/report/TransitiveDeps.vue'
import ReportUsedBy from '../../components/report/UsedBy.vue'
import ReportVulnerability from '../../components/report/Vulnerability.vue'

const location = window.location

const params = useRoute().params as Record<string, string>
const selected = computed(() => params.report?.[0] || 'all')
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <!-- Two axe-core-measured contrast fixes on every active tab below:
         `btn-action` always applies `op75`, so `op100!` is needed to stop the
         active color being diluted toward its 5%-tint background; and the
         plain `text-*`/DEFAULT shade is tuned for its own solid swatch, not
         for sitting on that same near-white/near-black tint, so `-700` /
         `dark:-300` (matching the shades used elsewhere, e.g. `PackageBorder.vue`)
         replace it. -->
    <NuxtLink btn-action as="button" :to="{ path: '/report', hash: location.hash }" exact-active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
      <div i-ph-grid-four-duotone />
      All
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/funding', hash: location.hash }" active-class="text-rose-700 dark:text-rose-300 bg-rose:5 op100!">
      <div i-ph-heart-duotone />
      Funding
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/dependencies', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
      <div i-ph-link-simple-duotone />
      Dependencies
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/deprecated', hash: location.hash }" active-class="text-red-700 dark:text-red-300 bg-red:5 op100!">
      <div i-ph-warning-duotone />
      Deprecated
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/vulnerabilities', hash: location.hash }" active-class="text-red-700 dark:text-red-300 bg-red:5 op100!">
      <div i-ph-warning-duotone />
      Vulnerabilities
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/multiple-versions', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
      <div i-ph-copy-duotone />
      Multiple Versions
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/maintainer-actions', hash: location.hash }" active-class="text-amber-700 dark:text-amber-300 bg-amber:5 op100!">
      <div i-ph-pipe-wrench-duotone />
      Maintainer Actions
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/install-size', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
      <div i-ph-package-duotone />
      Install Size
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/time', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
      <div i-ph-clock-duotone />
      Publish Time
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/node-engines', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
      <div i-ph-hexagon-duotone />
      Node Engines
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/licenses', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
      <div i-ph-scales-duotone />
      Licenses
    </NuxtLink>
  </div>

  <ReportTransitiveDeps v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportUsedBy v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportInstallSize v-if="selected === 'install-size' || selected === 'all'" />
  <ReportVulnerability v-if="selected === 'vulnerabilities' || selected === 'all'" />
  <ReportPublishTime v-if="selected === 'time' || selected === 'all'" />
  <ReportDeprecated v-if="selected === 'deprecated' || selected === 'all'" />
  <ReportEngines v-if="selected === 'node-engines' || selected === 'all'" />
  <ReportLicenses v-if="selected === 'licenses' || selected === 'all'" />
  <ReportFunding v-if="selected === 'funding' || selected === 'all'" />
  <ReportMultipleVersions v-if="selected === 'multiple-versions' || selected === 'all'" />
  <ReportMaintainerActions v-if="selected === 'maintainer-actions' || selected === 'all'" />
</template>
