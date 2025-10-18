import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../../src'

// bun install --lockfile-only can be used to generate a lockfile without installing dependencies

describe('listBunPackageDependencies', () => {
  it('runs with simple fixture', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/simple', import.meta.url)),
      depth: 25,
      monorepo: false,
    })

    expect(list.packageManager).toBe('bun')
    expect(list.packageManagerVersion).toBeDefined()
    expect(list.packages.size).toBeGreaterThan(0)

    const packages = Array.from(list.packages.values())
    const workspacePackage = packages.find(p => p.workspace)
    expect(workspacePackage).toBeDefined()
    expect(workspacePackage?.name).toBe('test-bun-simple')

    const debug = packages.find(p => p.name === 'debug')
    expect(debug).toBeDefined()
    expect(debug?.clusters.has('dep:dev')).toBe(true)

    const ansis = packages.find(p => p.name === 'ansis')
    expect(ansis).toBeDefined()
    expect(ansis?.clusters.has('dep:prod')).toBe(true)

    const ms = packages.find(p => p.name === 'ms')
    expect(ms).toBeDefined()
    expect(debug?.dependencies.has(ms!.spec)).toBe(true)
  })

  it('handles nested and hoisted dependencies', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/nested', import.meta.url)),
      depth: 25,
      monorepo: false,
    })

    expect(list.packageManager).toBe('bun')
    expect(list.packageManagerVersion).toBeDefined()

    const packages = list.packages

    const rootWorkspace = Array.from(packages.values()).find(
      p => p.workspace,
    )
    expect(rootWorkspace?.name).toBe('test-bun-nested')

    const react = packages.get('react@18.2.0')
    expect(react).toBeDefined()
    expect(react?.clusters.has('dep:prod')).toBe(true)
    expect(react?.dependencies.has('loose-envify@1.4.0')).toBe(true)

    const reactDom = packages.get('react-dom@18.2.0')
    expect(reactDom).toBeDefined()
    expect(reactDom?.clusters.has('dep:prod')).toBe(true)
    expect(reactDom?.dependencies.has('loose-envify@1.4.0')).toBe(true)
    expect(reactDom?.dependencies.has('scheduler@0.23.2')).toBe(true)

    const hoistedScheduler = packages.get('scheduler@0.23.2')
    expect(hoistedScheduler).toBeDefined()
    expect(hoistedScheduler?.dependencies.has('loose-envify@1.4.0')).toBe(true)

    const nestedLooseEnvify = packages.get('loose-envify@1.4.0')
    expect(nestedLooseEnvify).toBeDefined()
    expect(nestedLooseEnvify?.dependencies.has('js-tokens@4.0.0')).toBe(true)

    const hoistedLooseEnvify = packages.get('loose-envify@1.3.0')
    expect(hoistedLooseEnvify).toBeDefined()
    expect(hoistedLooseEnvify?.dependencies.has('js-tokens@2.0.0')).toBe(true)

    const optional = packages.get('fsevents@2.3.3')
    expect(optional).toBeDefined()
    expect(optional?.clusters.has('dep:optional')).toBe(true)

    const dev = packages.get('@types/bun@1.3.0')
    expect(dev).toBeDefined()
    expect(dev?.clusters.has('dep:dev')).toBe(true)
  })

  it('links workspace dependencies', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/workspaces', import.meta.url)),
      depth: 25,
      monorepo: true,
    })

    expect(list.packageManager).toBe('bun')

    const workspaceA = list.packages.get('a@1.0.0')
    const workspaceB = list.packages.get('b@1.0.0')
    expect(workspaceA?.workspace).toBe(true)
    expect(workspaceB?.workspace).toBe(true)

    expect(workspaceA?.dependencies.has('b@1.0.0')).toBe(true)
  })
})
