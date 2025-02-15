import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    {
      input: 'src/node/index.ts',
      name: 'index',
      outDir: 'dist',
    },
    {
      input: 'src/node/cli.ts',
      name: 'cli',
      outDir: 'dist',
    },
    {
      input: 'src/node/dirs.ts',
      name: 'dirs',
      outDir: 'dist',
    },
  ],
  clean: false,
  declaration: true,
  rollup: {
    inlineDependencies: true,
  },
})
