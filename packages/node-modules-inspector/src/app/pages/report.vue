<template>
  <CanvasContainer>
    <SubTitle>Packages with the Most of Transitive Dependencies</SubTitle>
    <ReportMostDeps />
    <SubTitle>Multi-Versions Packages</SubTitle>
    <div badge-color-primary flex="~ gap-2 items-center" rounded-lg p2 my2>
      <div i-ph-lightbulb-duotone flex-none />
      <span>Run <code color-base>`pnpm dedupe`</code> to de-duplicate packages that satisfies with the ranges</span>
    </div>
    <ReportMultipleVersions />
  </CanvasContainer>
</template>
