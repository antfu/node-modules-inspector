<template>
  <CanvasContainer>
    <ReportMostDeps />
    <div grid="~ cols-2 gap-8">
      <ReportLargestSize />
      <!-- TODO: replace to another report -->
      <ReportLargestSize />
    </div>
    <ReportMultipleVersions />
  </CanvasContainer>
</template>
