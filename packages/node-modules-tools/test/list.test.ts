import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { listPackageDependencies } from '../src'

it('runs', async () => {
  const list = await listPackageDependencies({
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    depth: 25,
    monorepo: false,
  })

  const item = Array.from(list.packages.values()).find(i => i.name === 'debug')

  expect(item).toBeDefined()
  expect({
    ...item,
    path: undefined,
  }).toMatchInlineSnapshot(`
    {
      "dependencies": Set {
        "ms@2.1.3",
      },
      "dependents": Set {
        "@babel/core@7.26.0",
        "@babel/traverse@7.25.9",
      },
      "depth": 4,
      "dev": true,
      "filepath": "/Users/antfu/i/node-modules-inspector/node_modules/.pnpm/debug@4.4.0/node_modules/debug",
      "flatDependencies": Set {
        "ms@2.1.3",
      },
      "flatDependents": Set {
        "node-modules-tools@0.0.1",
        "unbuild@3.3.1",
        "untyped@1.5.2",
        "@babel/core@7.26.0",
        "@babel/traverse@7.25.9",
        "@babel/helper-module-transforms@7.26.0",
        "@babel/helper-module-imports@7.25.9",
      },
      "name": "debug",
      "path": undefined,
      "resolved": {
        "author": "Josh Junon (https://github.com/qix-)",
        "engines": {
          "node": ">=6.0",
        },
        "license": "MIT",
        "module": "cjs",
        "repository": "git://github.com/debug-js/debug.git",
      },
      "spec": "debug@4.4.0",
      "version": "4.4.0",
    }
  `)
})
