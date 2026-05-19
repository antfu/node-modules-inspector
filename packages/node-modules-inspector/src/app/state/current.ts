import { computed } from 'vue'
import { findMaintainerActionByKey } from './maintainer-actions'
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

export const selectedAction = computed({
  get() {
    return findMaintainerActionByKey(query.selectedAction)
  },
  set(v) {
    query.selectedAction = v?.key
  },
})
