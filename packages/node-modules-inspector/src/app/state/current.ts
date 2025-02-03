import { computed } from 'vue'
import { payload } from './payload'
import { query } from './query'

export const selectedNode = computed({
  get() {
    return query.selected ? payload.all.get(query.selected) : undefined
  },
  set(v) {
    query.selected = v?.spec
  },
})
