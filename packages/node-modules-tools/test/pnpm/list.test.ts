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
        "dependencies": Set {},
        "dependents": Set {
          "rollup-plugin-esbuild@6.2.1",
          "@typescript-eslint/typescript-estree@8.59.2",
          "@typescript-eslint/project-service@8.59.2",
          "vite-plugin-inspect@11.3.3",
          "eslint-plugin-jsdoc@62.9.0",
          "eslint-plugin-import-x@4.16.1",
          "ioredis@5.10.1",
          "eslint-plugin-unimport@0.1.2",
          "simple-git@3.36.0",
          "@kwsites/file-exists@1.1.1",
          "eslint-plugin-yml@3.3.1",
          "eslint-plugin-toml@1.3.1",
          "@typescript-eslint/parser@8.56.1",
          "@nuxt/cli@3.35.1",
          "https-proxy-agent@7.0.6",
          "send@1.2.0",
          "body-parser@2.1.0",
        },
        "depth": 2,
        "filepath": undefined,
        "flatClusters": Set {
          "dep:dev",
          "catalog:bundling",
          "catalog:lint",
          "catalog:dev",
          "catalog:deps",
        },
        "flatDependencies": Set {},
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
            "version": "4.4.3",
          },
        },
        "shallowestDependent": Set {
          "rollup-plugin-esbuild@6.2.1",
          "vite-plugin-inspect@11.3.3",
        },
        "spec": "debug@4.4.3",
        "version": "4.4.3",
      }
    `)

    expect(
      Array.from(item?.flatDependents ?? [])
        .filter(d => !d.startsWith('node-modules-tools@') && !d.startsWith('#'))
        .sort((a, b) => a.localeCompare(b)),
    ).toMatchInlineSnapshot(`
      [
        "@antfu/eslint-config@8.2.0",
        "@kwsites/file-exists@1.1.1",
        "@mapbox/node-pre-gyp@2.0.0",
        "@modelcontextprotocol/sdk@1.25.3",
        "@nuxt/cli@3.35.1",
        "@nuxt/devtools@3.2.4",
        "@nuxt/eslint-config@1.15.2",
        "@nuxt/eslint-plugin@1.15.2",
        "@nuxt/eslint@1.15.2",
        "@nuxt/nitro-server@4.4.2",
        "@nuxt/vite-builder@4.4.2",
        "@typescript-eslint/parser@8.56.1",
        "@typescript-eslint/project-service@8.59.2",
        "@typescript-eslint/rule-tester@8.56.1",
        "@typescript-eslint/typescript-estree@8.59.2",
        "@typescript-eslint/utils@8.59.2",
        "@vercel/nft@1.5.0",
        "@vitest/eslint-plugin@1.6.16",
        "@vueuse/nuxt@14.3.0",
        "body-parser@2.1.0",
        "devframe@0.2.0",
        "eslint-plugin-command@3.5.2",
        "eslint-plugin-import-x@4.16.1",
        "eslint-plugin-jsdoc@62.9.0",
        "eslint-plugin-perfectionist@5.9.0",
        "eslint-plugin-toml@1.3.1",
        "eslint-plugin-unimport@0.1.2",
        "eslint-plugin-yml@3.3.1",
        "express-rate-limit@7.5.0",
        "express@5.0.1",
        "https-proxy-agent@7.0.6",
        "ioredis@5.10.1",
        "nitropack@2.13.4",
        "node-modules-inspector@link:packages/node-modules-inspector",
        "nuxt-eslint-auto-explicit-import@0.1.1",
        "nuxt@4.4.2",
        "rollup-plugin-esbuild@6.2.1",
        "send@1.2.0",
        "simple-git@3.36.0",
        "unstorage@1.17.5",
        "vite-plugin-inspect@11.3.3",
      ]
    `)
  })
})
