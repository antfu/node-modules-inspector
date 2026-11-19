import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterAll, describe, expect, it } from 'vitest'
import { createVirtualStoreResolver, depPathToDirName } from './paths'

describe('depPathToDirName', () => {
  it('encodes pnpm dep paths the way the virtual store lays them out', () => {
    expect(depPathToDirName('ms@2.1.2')).toBe('ms@2.1.2')
    expect(depPathToDirName('@sindresorhus/is@7.0.0')).toBe('@sindresorhus+is@7.0.0')
    expect(depPathToDirName('react-dom@18.3.1(react@18.3.1)')).toBe('react-dom@18.3.1_react@18.3.1')
    // Nested peers keep a trailing `_`, matching pnpm's `depPathToFilename`
    expect(depPathToDirName('a@1.0.0(b@2.0.0(c@3.0.0))')).toBe('a@1.0.0_b@2.0.0_c@3.0.0_')
  })
})

describe('createVirtualStoreResolver', () => {
  const roots: string[] = []

  function makeRoot(layout: Record<string, string>) {
    const root = mkdtempSync(join(tmpdir(), 'nmi-pnpm-compat-'))
    roots.push(root)
    for (const [dir, name] of Object.entries(layout)) {
      const dirPath = join(root, dir, 'node_modules', name)
      mkdirSync(dirPath, { recursive: true })
      writeFileSync(join(dirPath, 'package.json'), '{}')
    }
    return root
  }

  afterAll(() => {
    for (const root of roots)
      rmSync(root, { recursive: true, force: true })
  })

  it('resolves entries inside the virtual store', () => {
    const root = makeRoot({
      'node_modules/.aube/debug@4.3.4': 'debug',
    })
    const resolve = createVirtualStoreResolver(root, ['.aube'])

    expect(resolve('debug', '4.3.4')).toBe(join(root, 'node_modules/.aube/debug@4.3.4/node_modules/debug'))
    expect(resolve('debug', '4.3.5')).toBeUndefined()
  })

  it('resolves peer-suffixed and scoped directory names', () => {
    const root = makeRoot({
      'node_modules/.store/react-dom@18.3.1_react@18.3.1': 'react-dom',
      'node_modules/.store/@sindresorhus+is@7.0.0': '@sindresorhus/is',
    })
    const resolve = createVirtualStoreResolver(root, ['.store'])

    expect(resolve('react-dom', '18.3.1')).toBe(join(root, 'node_modules/.store/react-dom@18.3.1_react@18.3.1/node_modules/react-dom'))
    expect(resolve('@sindresorhus/is', '7.0.0')).toBe(join(root, 'node_modules/.store/@sindresorhus+is@7.0.0/node_modules/@sindresorhus/is'))
  })

  it('falls back to the top level entry', () => {
    const root = makeRoot({
      'node_modules/ms': 'ms',
    })
    const resolve = createVirtualStoreResolver(root, ['.aube'])

    expect(resolve('ms', '2.1.3')).toBe(join(root, 'node_modules/ms'))
  })
})
