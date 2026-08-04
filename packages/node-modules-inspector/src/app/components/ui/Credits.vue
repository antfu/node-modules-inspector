<template>
  <div flex="~ gap-1.1 items-center" p3 pl5 pr4 text-hex-222a dark:text-hex-888e>
    Made with
    <a href="https://nuxt.com" target="_blank" rel="noopener" flex="~ gap-1.1 items-center">
      <div i-logos-nuxt-icon text-0.6rem mr--0.6 />
      <!-- Nuxt's brand green (#01dc82) only clears ~1.8:1 on white
           (axe-core-measured) — darken for light mode, keep the bright brand
           color (already ~10.4:1 on #111) for dark mode. -->
      <span text-hex-005424 dark:text-hex-01dc82>Nuxt</span>
    </a>
    and
    <div i-ph-heart-duotone text-rose />
    by
    <a href="https://github.com/antfu" target="_blank" rel="noopener" hover="underline">Anthony Fu</a>
    <div flex-auto />
    <a href="https://github.com/antfu/node-modules-inspector" target="_blank" rel="noopener" op-fade hover:op100>
      <div i-ri-github-fill text-lg />
    </a>
  </div>
</template>
