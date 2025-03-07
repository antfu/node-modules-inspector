<script setup lang="ts">
import { useRoute } from '#app/composables/router'
import { computed } from 'vue'

const params = useRoute().params as Record<string, string>
const selected = computed(() => params.report[0] || 'all')
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <NuxtLink btn-action as="button" to="/report/funding" active-class="text-rose bg-rose:5">
      <div i-ph-heart-duotone />
      Funding
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/report/dependencies" active-class="text-primary bg-primary:5">
      <div i-ph-link-simple-duotone />
      Dependencies
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/report/multiple-versions" active-class="text-primary bg-primary:5">
      <div i-ph-copy-duotone />
      Multiple Versions
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/report/install-size" active-class="text-primary bg-primary:5">
      <div i-ph-package-duotone />
      Install Size
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/report/time" active-class="text-primary bg-primary:5">
      <div i-ph-clock-duotone />
      Publish Time
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/report/node-engines" active-class="text-primary bg-primary:5">
      <div i-ph-hexagon-duotone />
      Node Engines
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/report/licenses" active-class="text-primary bg-primary:5">
      <div i-ph-scales-duotone />
      Licenses
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/report" active-class="text-primary bg-primary:5">
      <div i-ph-grid-four-duotone />
      All
    </NuxtLink>
  </div>

  <ReportTransitiveDeps v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportUsedBy v-if="selected === 'dependencies' || selected === 'all'" />
  <ReportInstallSize v-if="selected === 'install-size' || selected === 'all'" />
  <ReportPublishTime v-if="selected === 'time' || selected === 'all'" />
  <ReportEngines v-if="selected === 'node-engines' || selected === 'all'" />
  <ReportLicenses v-if="selected === 'licenses' || selected === 'all'" />
  <ReportFunding v-if="selected === 'funding' || selected === 'all'" />
  <ReportMultipleVersions v-if="selected === 'multiple-versions' || selected === 'all'" />
</template>
