import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/cli.ts',
  ],
  clean: false,
  rollup: {
    inlineDependencies: true,
  },
})
