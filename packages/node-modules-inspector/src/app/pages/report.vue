<template>
  <UiOffsettedContainer>
    <ReportMostDeps />
    <ReportLargestSize />
    <div grid="~ cols-2 gap-5">
      <ReportHighestEngines />
      <ReportUsedBy />
    </div>
    <ReportMultipleVersions />
  </UiOffsettedContainer>
</template>
