import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../src'

describe('listPackageDependencies', () => {
  it('runs with multiple package.json files', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/multiple-package-jsons', import.meta.url)),
      depth: 25,
      monorepo: true,
      workspace: false,
    })

    expect(list.packages.size).toBe(2)
  })

  it('runs on this repository', async () => {
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
        "@babel/core@7.26.9",
        "@babel/traverse@7.26.9",
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
        "funding": undefined,
        "homepage": undefined,
        "installSize": {
          "bytes": 42798,
          "categories": {
            "doc": {
              "bytes": 22115,
              "count": 1,
            },
            "js": {
              "bytes": 18020,
              "count": 4,
            },
            "json": {
              "bytes": 1524,
              "count": 1,
            },
            "other": {
              "bytes": 1139,
              "count": 1,
            },
          },
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
      "@babel/core@7.26.9",
      "@babel/traverse@7.26.9",
      "@babel/helper-module-transforms@7.26.0",
      "@babel/helper-module-imports@7.25.9",
    ]
  `)
  })
})
