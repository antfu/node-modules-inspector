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
    filepath: undefined,
    flatDependents: undefined,
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
      "filepath": undefined,
      "flatDependencies": Set {
        "ms@2.1.3",
      },
      "flatDependents": undefined,
      "name": "debug",
      "resolved": {
        "author": "Josh Junon (https://github.com/qix-)",
        "engines": {
          "node": ">=6.0",
        },
        "homepage": undefined,
        "installSize": {
          "bytes": 42798,
        },
        "license": "MIT",
        "module": "cjs",
        "repository": "https://github.com/debug-js/debug",
      },
      "spec": "debug@4.4.0",
      "version": "4.4.0",
    }
  `)
  expect(Array.from(item?.flatDependents ?? []).filter(d => !d.startsWith('node-modules-tools@'))).toMatchInlineSnapshot(`
    [
      "unbuild@3.3.1",
      "untyped@1.5.2",
      "@babel/core@7.26.0",
      "@babel/traverse@7.25.9",
      "@babel/helper-module-transforms@7.26.0",
      "@babel/helper-module-imports@7.25.9",
    ]
  `)
})
