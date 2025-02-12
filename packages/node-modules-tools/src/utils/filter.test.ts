import { describe, expect, it } from 'vitest'
import { constructPackageFilter } from './filter'

describe('constructPackageFilter', () => {
  it('exact', () => {
    const filter = constructPackageFilter('foo@1.0.0')
    expect(filter({ name: 'foo', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'foo', version: '2.0.0' })).toBe(false)
  })

  it('exact with scope', () => {
    const filter = constructPackageFilter('@foo/bar@1.0.0')
    expect(filter({ name: '@foo/bar', version: '1.0.0' })).toBe(true)
    expect(filter({ name: '@foo/bar', version: '2.0.0' })).toBe(false)
  })

  it('any version', () => {
    const filter = constructPackageFilter('foo')
    expect(filter({ name: 'foo', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'foo', version: '2.0.0' })).toBe(true)
  })

  it('semver range', () => {
    const filter = constructPackageFilter('foo@^1.0.0')
    expect(filter({ name: 'foo', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'foo', version: '1.1.0' })).toBe(true)
    expect(filter({ name: 'foo', version: '2.0.0' })).toBe(false)
  })

  it('prefix', () => {
    const filter = constructPackageFilter('foo-*')
    expect(filter({ name: 'foo-bar', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'foo-bar', version: '2.0.0' })).toBe(true)
    expect(filter({ name: 'bar-foo', version: '1.0.0' })).toBe(false)
  })

  it('wildcard', () => {
    const filter = constructPackageFilter('*foo*')
    expect(filter({ name: 'foo-bar', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'bar-foo', version: '2.0.0' })).toBe(true)
    expect(filter({ name: 'bar', version: '1.0.0' })).toBe(false)
  })

  it('wildcard with dot', () => {
    const filter = constructPackageFilter('foo.*')
    expect(filter({ name: 'foo.bar', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'foo-bar', version: '2.0.0' })).toBe(false)
  })

  it('wildcard with dot and dash', () => {
    const filter = constructPackageFilter('foo.*-bar')
    expect(filter({ name: 'foo.bar-bar', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'foo-bar', version: '2.0.0' })).toBe(false)
  })

  it('wildcard with dot and dash and wildcard', () => {
    const filter = constructPackageFilter('foo.*-bar*')
    expect(filter({ name: 'foo.bar-bar', version: '1.0.0' })).toBe(true)
    expect(filter({ name: 'foo-bar', version: '2.0.0' })).toBe(false)
    expect(filter({ name: 'foo.bar', version: '1.0.0' })).toBe(false)
  })
})
