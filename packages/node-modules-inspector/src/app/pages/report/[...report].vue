<script setup lang="ts">
import { useRoute } from '#app/composables/router'
import { computed } from 'vue'

const location = window.location

const params = useRoute().params as Record<string, string>
const selected = computed(() => params.report[0] || 'all')
const isWebContainer = import.meta.env.BACKEND === 'webcontainer'
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <NuxtLink btn-action as="button" :to="{ path: '/report/funding', hash: location.hash }" active-class="text-rose bg-rose:5">
      <div i-ph-heart-duotone />
      Funding
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/dependencies', hash: location.hash }" active-class="text-primary bg-primary:5">
      <div i-ph-link-simple-duotone />
      Dependencies
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/deprecated', hash: location.hash }" active-class="text-red bg-red:5">
      <div i-ph-warning-duotone />
      Deprecated
    </NuxtLink>
    <!-- npm /advisories/bulk has CORP issue. -->
    <NuxtLink v-if="!isWebContainer" btn-action as="button" :to="{ path: '/report/vulnerabilities', hash: location.hash }" active-class="text-red bg-red:5">
      <div i-ph-warning-duotone />
      Vulnerabilities
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/multiple-versions', hash: location.hash }" active-class="text-primary bg-primary:5">
      <div i-ph-copy-duotone />
      Multiple Versions
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/install-size', hash: location.hash }" active-class="text-primary bg-primary:5">
      <div i-ph-package-duotone />
      Install Size
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/time', hash: location.hash }" active-class="text-primary bg-primary:5">
      <div i-ph-clock-duotone />
      Publish Time
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/node-engines', hash: location.hash }" active-class="text-primary bg-primary:5">
      <div i-ph-hexagon-duotone />
      Node Engines
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report/licenses', hash: location.hash }" active-class="text-primary bg-primary:5">
      <div i-ph-scales-duotone />
      Licenses
    </NuxtLink>
    <NuxtLink btn-action as="button" :to="{ path: '/report', hash: location.hash }" active-class="text-primary bg-primary:5">
      <div i-ph-grid-four-duotone />
      All
    </NuxtLink>
  </div>

  <ReportTransitiveDeps v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportUsedBy v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportInstallSize v-if="selected === 'install-size' || selected === 'all'" />
  <ReportVulnerability v-if="!isWebContainer && (selected === 'vulnerabilities' || selected === 'all')" />
  <ReportPublishTime v-if="selected === 'time' || selected === 'all'" />
  <ReportDeprecated v-if="selected === 'deprecated' || selected === 'all'" />
  <ReportEngines v-if="selected === 'node-engines' || selected === 'all'" />
  <ReportLicenses v-if="selected === 'licenses' || selected === 'all'" />
  <ReportFunding v-if="selected === 'funding' || selected === 'all'" />
  <ReportMultipleVersions v-if="selected === 'multiple-versions' || selected === 'all'" />
</template>
