import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { listPackageDependencies } from '../src'

it('runs', async () => {
  const list = await listPackageDependencies({
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    depth: 25,
    monorepo: false,
  })

  const item = list.packages.get('@babel/core')

  expect(item).toBeDefined()
  expect({
    ...item,
    path: undefined,
  }).toMatchInlineSnapshot(`
    {
      "dependencies": Set {
        "convert-source-map@2.0.0",
        "gensync@1.0.0-beta.2",
        "json5@2.2.3",
        "semver@6.3.1",
        "@babel/code-frame@7.26.2",
        "@babel/types@7.26.7",
        "debug@4.4.0",
        "@babel/parser@7.26.7",
        "@ampproject/remapping@2.3.0",
        "@babel/generator@7.26.2",
        "@babel/helper-compilation-targets@7.25.9",
        "@babel/template@7.25.9",
        "@babel/helpers@7.26.0",
        "@babel/traverse@7.25.9",
        "@babel/helper-module-transforms@7.26.0",
      },
      "dependents": Set {
        "untyped@1.5.2",
      },
      "dev": true,
      "flatDependencies": Set {
        "convert-source-map@2.0.0",
        "gensync@1.0.0-beta.2",
        "json5@2.2.3",
        "semver@6.3.1",
        "@babel/code-frame@7.26.2",
        "@babel/types@7.26.7",
        "debug@4.4.0",
        "@babel/parser@7.26.7",
        "@ampproject/remapping@2.3.0",
        "@babel/generator@7.26.2",
        "@babel/helper-compilation-targets@7.25.9",
        "@babel/template@7.25.9",
        "@babel/helpers@7.26.0",
        "@babel/traverse@7.25.9",
        "@babel/helper-module-transforms@7.26.0",
        "@babel/helper-validator-identifier@7.25.9",
        "js-tokens@4.0.0",
        "picocolors@1.1.1",
        "@babel/helper-string-parser@7.25.9",
        "ms@2.1.3",
        "@jridgewell/trace-mapping@0.3.25",
        "@jridgewell/gen-mapping@0.3.5",
        "@jridgewell/resolve-uri@3.1.2",
        "@jridgewell/sourcemap-codec@1.5.0",
        "@jridgewell/set-array@1.2.1",
        "jsesc@3.0.2",
        "@babel/compat-data@7.26.2",
        "@babel/helper-validator-option@7.25.9",
        "lru-cache@5.1.1",
        "browserslist@4.24.2",
        "globals@11.12.0",
        "@babel/core@7.26.0",
        "@babel/helper-module-imports@7.25.9",
        "yallist@3.1.1",
        "caniuse-lite@1.0.30001686",
        "electron-to-chromium@1.5.68",
        "node-releases@2.0.18",
        "update-browserslist-db@1.1.1",
        "escalade@3.2.0",
      },
      "flatDependents": Set {
        "untyped@1.5.2",
        "unbuild@3.3.1",
      },
      "name": "@babel/core",
      "nestedLevels": Set {
        3,
      },
      "optional": false,
      "path": undefined,
      "prod": false,
      "resolved": {
        "author": "The Babel Team (https://babel.dev/team)",
        "engines": {
          "node": ">=6.9.0",
        },
        "license": "MIT",
        "module": "cjs",
        "repository": "https://github.com/babel/babel.git",
      },
      "spec": "@babel/core@7.26.0",
      "version": "7.26.0",
    }
  `)
})
