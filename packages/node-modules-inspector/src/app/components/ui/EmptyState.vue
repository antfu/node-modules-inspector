<script setup lang="ts">
import FeedbackTip from '@antfu/design/components/Feedback/FeedbackTip.vue'
import UiSubTitle from './SubTitle.vue'

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
