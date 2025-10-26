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
          "eslint@9.38.0",
          "@eslint/config-array@0.21.1",
          "@eslint/eslintrc@3.3.1",
          "@typescript-eslint/typescript-estree@8.46.2",
          "@typescript-eslint/project-service@8.46.2",
          "vitest@4.0.3",
          "eslint-plugin-unimport@0.1.2",
          "vite-plugin-inspect@11.3.3",
          "simple-git@3.28.0",
          "@kwsites/file-exists@1.1.1",
          "eslint-plugin-jsdoc@59.1.0",
          "vue-eslint-parser@10.2.0",
          "@typescript-eslint/parser@8.46.1",
          "@typescript-eslint/typescript-estree@8.46.1",
          "@typescript-eslint/project-service@8.46.1",
          "eslint-plugin-toml@0.12.0",
          "eslint-plugin-yml@1.19.0",
          "micromark@4.0.1",
          "@typescript-eslint/type-utils@8.46.1",
          "@eslint/config-inspector@1.2.0",
          "eslint-plugin-jsdoc@54.7.0",
          "eslint-plugin-import-x@4.16.1",
          "ioredis@5.8.2",
          "vite-node@3.2.4",
          "@babel/core@7.28.4",
          "@babel/traverse@7.28.4",
          "send@1.2.0",
          "https-proxy-agent@7.0.6",
          "nuxt-mcp@0.2.4",
          "body-parser@2.1.0",
          "vite-plugin-mcp@0.2.4",
        },
        "depth": 2,
        "filepath": undefined,
        "flatClusters": Set {
          "dep:dev",
          "catalog:bundling",
          "catalog:lint",
          "catalog:testing",
          "catalog:dev",
          "catalog:deps",
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
            "version": "4.4.3",
          },
        },
        "shallowestDependent": Set {
          "rollup-plugin-esbuild@6.2.1",
          "eslint@9.38.0",
          "vitest@4.0.3",
          "vite-plugin-inspect@11.3.3",
          "nuxt-mcp@0.2.4",
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
        "@antfu/eslint-config@6.0.0",
        "@babel/core@7.28.4",
        "@babel/helper-create-class-features-plugin@7.27.1",
        "@babel/helper-member-expression-to-functions@7.27.1",
        "@babel/helper-module-imports@7.27.1",
        "@babel/helper-module-transforms@7.28.3",
        "@babel/helper-replace-supers@7.27.1",
        "@babel/helper-skip-transparent-expression-wrappers@7.27.1",
        "@babel/plugin-syntax-jsx@7.27.1",
        "@babel/plugin-syntax-typescript@7.27.1",
        "@babel/plugin-transform-typescript@7.28.0",
        "@babel/traverse@7.28.4",
        "@eslint-community/eslint-plugin-eslint-comments@4.5.0",
        "@eslint-community/eslint-utils@4.9.0",
        "@eslint/compat@1.2.7",
        "@eslint/config-array@0.21.1",
        "@eslint/config-inspector@1.2.0",
        "@eslint/eslintrc@3.3.1",
        "@eslint/markdown@7.4.0",
        "@kwsites/file-exists@1.1.1",
        "@mapbox/node-pre-gyp@2.0.0",
        "@modelcontextprotocol/sdk@1.17.2",
        "@nuxt/devtools@2.6.5",
        "@nuxt/eslint-config@1.9.0",
        "@nuxt/eslint-plugin@1.9.0",
        "@nuxt/eslint@1.9.0",
        "@nuxt/nitro-server@4.2.0",
        "@nuxt/vite-builder@4.2.0",
        "@stylistic/eslint-plugin@5.4.0",
        "@typescript-eslint/eslint-plugin@8.46.1",
        "@typescript-eslint/parser@8.46.1",
        "@typescript-eslint/project-service@8.46.1",
        "@typescript-eslint/project-service@8.46.2",
        "@typescript-eslint/type-utils@8.46.1",
        "@typescript-eslint/typescript-estree@8.46.1",
        "@typescript-eslint/typescript-estree@8.46.2",
        "@typescript-eslint/utils@8.46.1",
        "@typescript-eslint/utils@8.46.2",
        "@unocss/eslint-config@66.5.4",
        "@unocss/eslint-plugin@66.5.4",
        "@vercel/nft@0.30.3",
        "@vitejs/plugin-vue-jsx@5.1.1",
        "@vitest/eslint-plugin@1.3.20",
        "@vue/babel-plugin-jsx@1.5.0",
        "@vue/babel-plugin-resolve-type@1.5.0",
        "body-parser@2.1.0",
        "eslint-compat-utils@0.5.1",
        "eslint-compat-utils@0.6.4",
        "eslint-config-flat-gitignore@2.1.0",
        "eslint-json-compat-utils@0.2.1",
        "eslint-merge-processors@2.0.0",
        "eslint-plugin-antfu@3.1.1",
        "eslint-plugin-command@3.3.1",
        "eslint-plugin-es-x@7.8.0",
        "eslint-plugin-import-lite@0.3.0",
        "eslint-plugin-import-x@4.16.1",
        "eslint-plugin-jsdoc@54.7.0",
        "eslint-plugin-jsdoc@59.1.0",
        "eslint-plugin-jsonc@2.21.0",
        "eslint-plugin-n@17.23.1",
        "eslint-plugin-perfectionist@4.15.1",
        "eslint-plugin-pnpm@1.2.0",
        "eslint-plugin-regexp@2.10.0",
        "eslint-plugin-toml@0.12.0",
        "eslint-plugin-unicorn@60.0.0",
        "eslint-plugin-unicorn@61.0.2",
        "eslint-plugin-unimport@0.1.2",
        "eslint-plugin-unused-imports@4.2.0",
        "eslint-plugin-vue@10.5.1",
        "eslint-plugin-yml@1.19.0",
        "eslint-processor-vue-blocks@2.0.0",
        "eslint-typegen@2.3.0",
        "eslint@9.38.0",
        "express-rate-limit@7.5.0",
        "express@5.0.1",
        "https-proxy-agent@7.0.6",
        "ioredis@5.8.2",
        "mdast-util-from-markdown@2.0.2",
        "mdast-util-frontmatter@2.0.1",
        "mdast-util-gfm-footnote@2.1.0",
        "mdast-util-gfm-strikethrough@2.0.0",
        "mdast-util-gfm-table@2.0.0",
        "mdast-util-gfm-task-list-item@2.0.0",
        "mdast-util-gfm@3.1.0",
        "micromark@4.0.1",
        "nitropack@2.12.8",
        "node-modules-inspector@link:packages/node-modules-inspector",
        "nuxt-eslint-auto-explicit-import@0.1.1",
        "nuxt-mcp@0.2.4",
        "nuxt@4.2.0",
        "rollup-plugin-esbuild@6.2.1",
        "send@1.2.0",
        "serve-static@2.2.0",
        "simple-git@3.28.0",
        "unstorage@1.17.1",
        "vite-node@3.2.4",
        "vite-plugin-checker@0.11.0",
        "vite-plugin-inspect@11.3.3",
        "vite-plugin-mcp@0.2.4",
        "vitest@4.0.3",
        "vue-eslint-parser@10.2.0",
      ]
    `)
  })
})
