import { describe, expect, it } from 'vitest'
import { constructExcludeMatcher, isRegistryResolvableSpec, parseInstallSpecs, parseNpmAlias } from './spec'

describe('isRegistryResolvableSpec', () => {
  it('accepts registry-resolvable specs', () => {
    expect(isRegistryResolvableSpec('^1.0.0')).toBe(true)
    expect(isRegistryResolvableSpec('*')).toBe(true)
    expect(isRegistryResolvableSpec('')).toBe(true)
    expect(isRegistryResolvableSpec('latest')).toBe(true)
    expect(isRegistryResolvableSpec('npm:foo@^1.0.0')).toBe(true)
    expect(isRegistryResolvableSpec('>=16 <19')).toBe(true)
  })

  it('rejects non-registry protocols', () => {
    expect(isRegistryResolvableSpec('workspace:*')).toBe(false)
    expect(isRegistryResolvableSpec('workspace:^')).toBe(false)
    expect(isRegistryResolvableSpec('catalog:default')).toBe(false)
    expect(isRegistryResolvableSpec('file:../foo')).toBe(false)
    expect(isRegistryResolvableSpec('link:../foo')).toBe(false)
    expect(isRegistryResolvableSpec('portal:../foo')).toBe(false)
    expect(isRegistryResolvableSpec('git://github.com/user/repo.git')).toBe(false)
    expect(isRegistryResolvableSpec('git+ssh://git@github.com/user/repo.git')).toBe(false)
    expect(isRegistryResolvableSpec('github:user/repo')).toBe(false)
    expect(isRegistryResolvableSpec('https://example.com/pkg.tgz')).toBe(false)
  })
})

describe('parseNpmAlias', () => {
  it('parses npm aliases', () => {
    expect(parseNpmAlias('npm:foo@^1.0.0')).toEqual({ name: 'foo', range: '^1.0.0' })
    expect(parseNpmAlias('npm:@scope/foo@2.x')).toEqual({ name: '@scope/foo', range: '2.x' })
    expect(parseNpmAlias('npm:foo')).toEqual({ name: 'foo', range: '*' })
    expect(parseNpmAlias('npm:@scope/foo')).toEqual({ name: '@scope/foo', range: '*' })
  })

  it('returns null for non-aliases', () => {
    expect(parseNpmAlias('^1.0.0')).toBeNull()
    expect(parseNpmAlias('workspace:*')).toBeNull()
  })
})

describe('parseInstallSpecs', () => {
  it('parses bare names', () => {
    expect(parseInstallSpecs('vue react').dependencies).toEqual({ vue: '*', react: '*' })
  })

  it('parses names with ranges', () => {
    expect(parseInstallSpecs('vue@^3.4 react@18 nuxt@latest').dependencies).toEqual({
      vue: '^3.4',
      react: '18',
      nuxt: 'latest',
    })
  })

  it('parses scoped names', () => {
    expect(parseInstallSpecs('@antfu/utils @antfu/eslint-config@^4.0.0').dependencies).toEqual({
      '@antfu/utils': '*',
      '@antfu/eslint-config': '^4.0.0',
    })
  })

  it('tolerates extra whitespace', () => {
    expect(parseInstallSpecs('  vue   react  ').dependencies).toEqual({ vue: '*', react: '*' })
    expect(parseInstallSpecs('')).toEqual({ dependencies: {}, excludes: [] })
  })

  it('parses exclude tokens', () => {
    const { dependencies, excludes } = parseInstallSpecs('nuxt -@nuxt/kit -vite')
    expect(dependencies).toEqual({ nuxt: '*' })
    expect(excludes).toEqual([
      { name: '@nuxt/kit', range: '*' },
      { name: 'vite', range: '*' },
    ])
  })

  it('parses exclude tokens with version ranges and wildcards', () => {
    const { dependencies, excludes } = parseInstallSpecs('nuxt@^3 -vite@5 -*eslint*')
    expect(dependencies).toEqual({ nuxt: '^3' })
    expect(excludes).toEqual([
      { name: 'vite', range: '5' },
      { name: '*eslint*', range: '*' },
    ])
  })

  it('ignores a lone dash', () => {
    expect(parseInstallSpecs('nuxt -')).toEqual({
      dependencies: { nuxt: '*' },
      excludes: [],
    })
  })

  it('parses input with only excludes', () => {
    expect(parseInstallSpecs('-vite')).toEqual({
      dependencies: {},
      excludes: [{ name: 'vite', range: '*' }],
    })
  })
})

describe('constructExcludeMatcher', () => {
  it('never matches with an empty exclude list', () => {
    const isExcluded = constructExcludeMatcher([])
    expect(isExcluded('vite', '^5')).toBe(false)
  })

  it('matches by exact name for bare excludes', () => {
    const isExcluded = constructExcludeMatcher([{ name: 'vite', range: '*' }])
    expect(isExcluded('vite', '^5')).toBe(true)
    expect(isExcluded('vite', 'latest')).toBe(true)
    expect(isExcluded('vitest', '^1')).toBe(false)
  })

  it('matches scoped names', () => {
    const isExcluded = constructExcludeMatcher([{ name: '@nuxt/kit', range: '*' }])
    expect(isExcluded('@nuxt/kit', '^3')).toBe(true)
    expect(isExcluded('@nuxt/schema', '^3')).toBe(false)
  })

  it('matches wildcard patterns', () => {
    const isExcluded = constructExcludeMatcher([{ name: '*eslint*', range: '*' }])
    expect(isExcluded('eslint', '^9')).toBe(true)
    expect(isExcluded('@antfu/eslint-config', '^4')).toBe(true)
    expect(isExcluded('prettier', '^3')).toBe(false)
  })

  it('matches ranged excludes against the requested range', () => {
    const isExcluded = constructExcludeMatcher([{ name: 'vite', range: '5' }])
    expect(isExcluded('vite', '^5')).toBe(true)
    expect(isExcluded('vite', '5.1.0')).toBe(true)
    expect(isExcluded('vite', '^4')).toBe(false)
  })

  it('matches ranged excludes against non-semver requested ranges', () => {
    const isExcluded = constructExcludeMatcher([{ name: 'vite', range: '5' }])
    // dist-tag / unknown requested range — fall back to name match
    expect(isExcluded('vite', 'latest')).toBe(true)
  })
})
