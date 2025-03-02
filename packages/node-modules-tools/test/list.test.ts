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
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
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
          "rollup-plugin-esbuild@6.2.1",
          "vitest@3.0.7",
          "vite-node@3.0.7",
          "eslint@9.21.0",
          "@eslint/config-array@0.19.2",
          "@eslint/eslintrc@3.3.0",
          "vite-plugin-inspect@11.0.0",
          "lint-staged@15.4.3",
          "node-modules-inspector@link:packages/node-modules-inspector",
          "@typescript-eslint/typescript-estree@8.25.0",
          "eslint-plugin-jsdoc@50.6.3",
          "vue-eslint-parser@9.4.3",
          "@typescript-eslint/parser@8.24.1",
          "@typescript-eslint/typescript-estree@8.24.1",
          "eslint-plugin-toml@0.12.0",
          "eslint-plugin-yml@1.17.0",
          "eslint-plugin-import-x@4.6.1",
          "micromark@4.0.1",
          "@typescript-eslint/type-utils@8.24.1",
          "eslint-plugin-unimport@0.1.2",
          "@babel/core@7.26.9",
          "@babel/traverse@7.26.9",
          "@eslint/config-inspector@1.0.0",
          "simple-git@3.27.0",
          "@kwsites/file-exists@1.1.1",
          "https-proxy-agent@5.0.1",
          "agent-base@6.0.2",
        },
        "depth": 2,
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
    expect(Array.from(item?.flatDependents ?? []).filter(d => !d.startsWith('node-modules-tools@') && !d.startsWith('#'))).toMatchInlineSnapshot(`
      [
        "rollup-plugin-esbuild@6.2.1",
        "vitest@3.0.7",
        "vite-node@3.0.7",
        "@nuxt/vite-builder@3.15.4",
        "nuxt@3.15.4",
        "eslint@9.21.0",
        "@eslint-community/eslint-utils@4.4.1",
        "@typescript-eslint/utils@8.25.0",
        "@unocss/eslint-plugin@66.0.0",
        "@unocss/eslint-config@66.0.0",
        "@stylistic/eslint-plugin@4.0.0",
        "@antfu/eslint-config@4.3.0",
        "@nuxt/eslint-config@1.1.0",
        "@nuxt/eslint@1.1.0",
        "@vitest/eslint-plugin@1.1.31",
        "eslint-plugin-import-x@4.6.1",
        "eslint-plugin-perfectionist@4.9.0",
        "eslint-plugin-unimport@0.1.2",
        "nuxt-eslint-auto-explicit-import@0.1.1",
        "@nuxt/eslint-plugin@1.1.0",
        "eslint-plugin-jsonc@2.19.1",
        "eslint-plugin-regexp@2.7.0",
        "eslint-plugin-unicorn@57.0.0",
        "eslint-plugin-vue@9.32.0",
        "eslint-plugin-n@17.15.1",
        "eslint-plugin-es-x@7.8.0",
        "@typescript-eslint/utils@8.24.1",
        "@typescript-eslint/eslint-plugin@8.24.1",
        "@typescript-eslint/type-utils@8.24.1",
        "@eslint-community/eslint-plugin-eslint-comments@4.4.1",
        "eslint-config-flat-gitignore@2.1.0",
        "eslint-merge-processors@2.0.0",
        "eslint-plugin-antfu@3.1.0",
        "eslint-plugin-command@3.1.0",
        "eslint-plugin-jsdoc@50.6.3",
        "eslint-plugin-unused-imports@4.1.4",
        "vue-eslint-parser@9.4.3",
        "@typescript-eslint/parser@8.24.1",
        "eslint-compat-utils@0.6.4",
        "eslint-plugin-toml@0.12.0",
        "eslint-plugin-yml@1.17.0",
        "eslint-json-compat-utils@0.2.1",
        "eslint-processor-vue-blocks@2.0.0",
        "eslint-compat-utils@0.5.1",
        "@eslint/config-inspector@1.0.0",
        "eslint-typegen@1.0.0",
        "@eslint/config-array@0.19.2",
        "@eslint/eslintrc@3.3.0",
        "vite-plugin-inspect@11.0.0",
        "@nuxt/devtools@2.1.1",
        "lint-staged@15.4.3",
        "node-modules-inspector@link:packages/node-modules-inspector",
        "@typescript-eslint/typescript-estree@8.25.0",
        "@typescript-eslint/typescript-estree@8.24.1",
        "micromark@4.0.1",
        "mdast-util-from-markdown@2.0.2",
        "@eslint/markdown@6.2.2",
        "mdast-util-gfm@3.0.0",
        "mdast-util-gfm-footnote@2.0.0",
        "mdast-util-gfm-strikethrough@2.0.0",
        "mdast-util-gfm-table@2.0.0",
        "mdast-util-gfm-task-list-item@2.0.0",
        "@babel/core@7.26.9",
        "untyped@1.5.2",
        "@nuxt/kit@3.15.4",
        "@nuxt/devtools-kit@2.1.1",
        "@nuxt/telemetry@2.6.4",
        "@babel/helper-module-transforms@7.26.0",
        "vite-plugin-vue-inspector@5.3.1",
        "@babel/plugin-syntax-import-attributes@7.26.0",
        "@babel/plugin-syntax-import-meta@7.10.4",
        "@babel/plugin-syntax-jsx@7.25.9",
        "@vue/babel-plugin-jsx@1.2.5",
        "@vitejs/plugin-vue-jsx@4.1.1",
        "@vue/babel-plugin-resolve-type@1.2.5",
        "@babel/plugin-proposal-decorators@7.25.9",
        "@babel/plugin-syntax-decorators@7.25.9",
        "@babel/helper-create-class-features-plugin@7.25.9",
        "@babel/plugin-transform-typescript@7.26.3",
        "@babel/helper-replace-supers@7.25.9",
        "@babel/plugin-syntax-typescript@7.25.9",
        "@babel/traverse@7.26.9",
        "@babel/helper-module-imports@7.25.9",
        "@babel/helper-member-expression-to-functions@7.25.9",
        "@babel/helper-skip-transparent-expression-wrappers@7.25.9",
        "simple-git@3.27.0",
        "@kwsites/file-exists@1.1.1",
        "https-proxy-agent@5.0.1",
        "@mapbox/node-pre-gyp@1.0.11",
        "@vercel/nft@0.24.4",
        "nitropack@2.8.1",
        "agent-base@6.0.2",
      ]
    `)
  })
})
