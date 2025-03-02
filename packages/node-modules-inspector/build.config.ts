import { resolve } from 'node:path'
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
      input: 'src/dirs.ts',
      name: 'dirs',
      outDir: 'dist',
    },
  ],
  alias: {
    '~~': resolve('src'),
  },
  clean: false,
  declaration: 'node16',
  rollup: {
    inlineDependencies: true,
  },
})
