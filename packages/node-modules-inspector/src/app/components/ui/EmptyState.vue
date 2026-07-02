<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  message: string
  type?: 'checkmark' | 'info'
  color?: 'gray' | 'green'
}>(), {
  type: 'info',
  color: 'gray',
})
</script>

<template>
  <UiSubTitle>
    {{ title }}
  </UiSubTitle>
  <FeedbackTip
    :type="props.color === 'green' ? 'success' : 'info'"
    :icon="props.type === 'checkmark' ? 'i-ph-check-circle-duotone' : 'i-ph-info-duotone'"
    my2
  >
    {{ message }}
  </FeedbackTip>
</template>
