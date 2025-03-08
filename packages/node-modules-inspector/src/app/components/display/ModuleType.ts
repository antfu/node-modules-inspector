import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import type { PropType } from 'vue'
import { Tooltip as FloatingTooltip } from 'floating-vue'
import { computed, defineComponent, h } from 'vue'
import { settings } from '../../state/settings'
import { getModuleType, MODULE_TYPES_COLOR_BADGE } from '../../utils/module-type'

// @unocss-include

export default defineComponent({
  name: 'DisplayModuleType',
  props: {
    pkg: {
      type: [Object, String] as PropType<PackageNode | PackageModuleType>,
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
    const description = computed(() => {
      if (type.value === 'cjs')
        return 'CommonJS module. The legacy non-standard format.'
      if (type.value === 'esm')
        return 'Standard Ecmascript module format'
      if (type.value === 'dual')
        return 'Package that ships both ESM and CJS'
      if (type.value === 'faux')
        return 'Package that ships non-standard module format, that might work with some bundlers but not Node.js'
      if (type.value === 'dts')
        return 'Package that ships TypeScript types'
    })

    return () => {
      if (settings.value.moduleTypeRender === 'none' && !props.force)
        return null

      if (settings.value.moduleTypeRender === 'circle' && !props.force) {
        return h(FloatingTooltip, {}, {
          default: () => h('div', {
            class: 'flex',
            title: type.value.toUpperCase(),
          }, h('div', {
            class: [
              'w-3 h-3 rounded-full border border-current!',
              MODULE_TYPES_COLOR_BADGE[type.value],
            ],
          })),
          popper: () => h('div', { class: 'text-sm' }, description.value),
        })
      }

      return h(FloatingTooltip, {}, {
        default: () => h('div', {
          class: [
            'select-none',
            MODULE_TYPES_COLOR_BADGE[type.value],
            props.badge ? 'w-11 flex-none text-center px1 rounded text-sm' : 'bg-transparent! w-auto!',
          ],
        }, type.value.toUpperCase()),
        popper: () => h('div', { class: 'text-sm' }, description.value),
      })
    }
  },
})
