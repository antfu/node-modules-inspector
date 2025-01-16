import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/node/cli.ts',
    'src/node/dirs.ts',
  ],
  clean: false,
  rollup: {
    inlineDependencies: true,
  },
})
