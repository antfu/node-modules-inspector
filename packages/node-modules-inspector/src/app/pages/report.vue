<template>
  <UiOffsettedContainer>
    <ReportTransitiveDeps />
    <ReportInstallSize />
    <div grid="~ cols-2 gap-5">
      <ReportEngines />
      <ReportUsedBy />
    </div>
    <ReportMultipleVersions />
  </UiOffsettedContainer>
</template>
