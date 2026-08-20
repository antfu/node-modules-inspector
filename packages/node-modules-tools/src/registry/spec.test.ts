import { describe, expect, it } from 'vitest'
import { isRegistryResolvableSpec, parseInstallSpecs, parseNpmAlias } from './spec'

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
    expect(parseInstallSpecs('vue react')).toEqual({ vue: '*', react: '*' })
  })

  it('parses names with ranges', () => {
    expect(parseInstallSpecs('vue@^3.4 react@18 nuxt@latest')).toEqual({
      vue: '^3.4',
      react: '18',
      nuxt: 'latest',
    })
  })

  it('parses scoped names', () => {
    expect(parseInstallSpecs('@antfu/utils @antfu/eslint-config@^4.0.0')).toEqual({
      '@antfu/utils': '*',
      '@antfu/eslint-config': '^4.0.0',
    })
  })

  it('tolerates extra whitespace', () => {
    expect(parseInstallSpecs('  vue   react  ')).toEqual({ vue: '*', react: '*' })
    expect(parseInstallSpecs('')).toEqual({})
  })
})
