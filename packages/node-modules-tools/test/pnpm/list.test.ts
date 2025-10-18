import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../../src'

describe('listPnpmPackageDependencies', () => {
  it('runs with multiple package.json files', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/multiple-package-jsons', import.meta.url)),
      depth: 25,
      monorepo: true,
      workspace: false,
    })

    expect(list.packageManager).toBe('pnpm')
    expect(list.packages.size).toBe(2)
  })

  it('runs on this repository', { timeout: 10000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('../../..', import.meta.url)),
      depth: 25,
      monorepo: false,
    })

    expect(list.packageManager).toBe('pnpm')

    const item = Array.from(list.packages.values()).find(i => i.name === 'debug')

    expect(item).toBeDefined()
    expect({
      ...item,
      filepath: undefined,
      flatDependents: undefined,
    }).toMatchInlineSnapshot(`
      {
        "clusters": Set {
          "dep:dev",
        },
        "dependencies": Set {
          "ms@2.1.3",
        },
        "dependents": Set {
          "rollup-plugin-esbuild@6.2.1",
          "vitest@3.2.4",
          "vite-node@3.2.4",
          "eslint-plugin-unimport@0.1.2",
          "vite-plugin-inspect@11.3.3",
          "simple-git@3.28.0",
          "@kwsites/file-exists@1.1.1",
          "@eslint/config-inspector@1.2.0",
          "nuxt-mcp@0.2.4",
        },
        "depth": 2,
        "filepath": undefined,
        "flatClusters": Set {
          "dep:dev",
          "catalog:bundling",
          "catalog:testing",
          "catalog:lint",
          "catalog:dev",
        },
        "flatDependencies": Set {
          "ms@2.1.3",
        },
        "flatDependents": undefined,
        "name": "debug",
        "resolved": {
          "installSize": {
            "bytes": 42793,
            "categories": {
              "doc": {
                "bytes": 22115,
                "count": 1,
              },
              "js": {
                "bytes": 18060,
                "count": 4,
              },
              "json": {
                "bytes": 1479,
                "count": 1,
              },
              "other": {
                "bytes": 1139,
                "count": 1,
              },
            },
          },
          "module": "cjs",
          "packageJson": {
            "author": "Josh Junon (https://github.com/qix-)",
            "dependencies": {
              "ms": "^2.1.3",
            },
            "description": "Lightweight debugging utility for Node.js and the browser",
            "devDependencies": {
              "brfs": "^2.0.1",
              "browserify": "^16.2.3",
              "coveralls": "^3.0.2",
              "karma": "^3.1.4",
              "karma-browserify": "^6.0.0",
              "karma-chrome-launcher": "^2.2.0",
              "karma-mocha": "^1.3.0",
              "mocha": "^5.2.0",
              "mocha-lcov-reporter": "^1.2.0",
              "sinon": "^14.0.0",
              "xo": "^0.23.0",
            },
            "engines": {
              "node": ">=6.0",
            },
            "keywords": [
              "debug",
              "log",
              "debugger",
            ],
            "license": "MIT",
            "main": "./src/index.js",
            "name": "debug",
            "repository": {
              "type": "git",
              "url": "git://github.com/debug-js/debug.git",
            },
            "version": "4.4.1",
          },
        },
        "shallowestDependent": Set {
          "rollup-plugin-esbuild@6.2.1",
          "vitest@3.2.4",
          "vite-plugin-inspect@11.3.3",
          "nuxt-mcp@0.2.4",
        },
        "spec": "debug@4.4.1",
        "version": "4.4.1",
      }
    `)

    expect(
      Array.from(item?.flatDependents ?? [])
        .filter(d => !d.startsWith('node-modules-tools@') && !d.startsWith('#'))
        .sort((a, b) => a.localeCompare(b)),
    ).toMatchInlineSnapshot(`
      [
        "@antfu/eslint-config@6.0.0",
        "@eslint/config-inspector@1.2.0",
        "@kwsites/file-exists@1.1.1",
        "@nuxt/devtools@2.6.5",
        "@nuxt/eslint@1.9.0",
        "@nuxt/vite-builder@4.1.3",
        "@vitest/eslint-plugin@1.3.20",
        "eslint-plugin-unimport@0.1.2",
        "nuxt-eslint-auto-explicit-import@0.1.1",
        "nuxt-mcp@0.2.4",
        "nuxt@4.1.3",
        "rollup-plugin-esbuild@6.2.1",
        "simple-git@3.28.0",
        "vite-node@3.2.4",
        "vite-plugin-inspect@11.3.3",
        "vitest@3.2.4",
      ]
    `)
  })
})
