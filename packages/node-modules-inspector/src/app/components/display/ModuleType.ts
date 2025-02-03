import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import type { PropType } from 'vue'
import { computed, defineComponent, h } from 'vue'
import { settings } from '~/state/settings'
import { getModuleType, MODULE_TYPES_COLOR_BADGE } from '~/utils/module-type'

// @unocss-include

export default defineComponent({
  name: 'DisplayModuleType',
  props: {
    pkg: {
      type: Object as PropType<PackageNode | PackageModuleType>,
      required: true,
    },
    badge: {
      type: Boolean,
      default: true,
    },
    force: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const type = computed(() => getModuleType(props.pkg))

    return () => {
      if (settings.value.moduleTypeHide && !props.force)
        return null

      if (settings.value.moduleTypeDot && !props.force) {
        return h('div', {
          class: 'flex',
          title: type.value.toUpperCase(),
        }, h('div', {
          class: [
            'w-3 h-3 rounded-full border border-current!',
            MODULE_TYPES_COLOR_BADGE[type.value],
          ],
        }))
      }

      return h('div', {
        class: [
          'select-none',
          MODULE_TYPES_COLOR_BADGE[type.value],
          props.badge ? 'w-11 flex-none text-center px1 rounded text-sm' : 'bg-transparent! w-auto!',
        ],
      }, type.value.toUpperCase())
    }
  },
})
