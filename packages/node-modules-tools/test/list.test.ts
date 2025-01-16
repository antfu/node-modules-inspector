import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { listPackageDependencies } from '../src'

it('runs', async () => {
  const list = await listPackageDependencies({
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    depth: 25,
    monorepo: false,
  })

  const item = list.packages.find(item => item.name === 'rollup')

  expect(item).toBeDefined()
  expect({
    ...item,
    path: undefined,
  }).toMatchInlineSnapshot(`
    {
      "dependencies": Set {},
      "dependents": Set {
        "unbuild@3.3.1",
      },
      "dev": true,
      "flatDependencies": Set {},
      "flatDependents": Set {
        "unbuild@3.3.1",
      },
      "name": "rollup",
      "nestedLevels": Set {
        2,
      },
      "optional": false,
      "path": undefined,
      "prod": false,
      "spec": "rollup@4.30.1",
      "version": "4.30.1",
    }
  `)
})
