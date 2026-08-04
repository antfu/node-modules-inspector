<template>
  <!-- `color-muted`, not `op-fade` — every caller nests a `DisplayNumberBadge`
       count here, and `op-fade`'s opacity dilutes that badge's own
       already-tuned `color-muted` text down to ~3.1:1 against its background
       (axe-core-measured), since CSS `opacity` on this ancestor also
       multiplies through non-color children like the badge's own bg tint. -->
  <h2 mt-6 mb-3 color-muted font-bold flex="~ gap-1 items-center">
    <slot />
  </h2>
</template>
