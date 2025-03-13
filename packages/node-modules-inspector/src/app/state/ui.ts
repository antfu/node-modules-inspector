import { computed } from 'vue'
import { query } from './query'
import { settings } from './settings'

export const isSettingOpen = computed({
  get() {
    return query.selected === '~settings'
  },
  set(value) {
    if (!value && query.selected === '~settings')
      query.selected = ''
    else if (value)
      query.selected = '~settings'
  },
})
export const isFiltersOpen = computed({
  get() {
    return query.selected === '~filters'
  },
  set(value) {
    if (!value && query.selected === '~filters')
      query.selected = ''
    else if (value)
      query.selected = '~filters'
  },
})

export const isSidepanelCollapsed = computed(() => {
  return settings.value.collapseSidepanel && !isFiltersOpen.value && !isSettingOpen.value
})
