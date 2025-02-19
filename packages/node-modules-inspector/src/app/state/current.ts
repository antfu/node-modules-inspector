import { computed } from 'vue'
import { payloads } from './payload'
import { query } from './query'

export const selectedNode = computed({
  get() {
    return query.selected ? payloads.main.get(query.selected) : undefined
  },
  set(v) {
    query.selected = v?.spec
  },
})
