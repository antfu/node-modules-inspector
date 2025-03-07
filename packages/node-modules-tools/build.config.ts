import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/utils',
    'src/constants',
  ],
  declaration: true,
  clean: true,
  rollup: {
    inlineDependencies: true,
  },
})
