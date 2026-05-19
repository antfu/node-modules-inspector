import type { PackageJson } from 'pkg-types'
import { describe, expect, it } from 'vitest'
import { normalizePkgAuthors, normalizePkgLicense, parseAuthor } from './package-json'

describe('normalize', () => {
  describe('normalizePkgLicense', () => {
    it('should parse legacy object format', () => {
      expect(normalizePkgLicense({ license: { type: 'MIT', url: 'dontcare' } } as unknown as PackageJson)).toMatchInlineSnapshot(`"MIT"`)
    })
    it('should parse legacy array format', () => {
      expect(normalizePkgLicense({ licenses: [] } as unknown as PackageJson)).toMatchInlineSnapshot(`undefined`)
      expect(normalizePkgLicense({ licenses: [{ type: 'MIT', url: 'dontcare' }] } as unknown as PackageJson)).toMatchInlineSnapshot(`"MIT"`)
      expect(normalizePkgLicense({ licenses: [{ type: 'MIT', url: 'dontcare' }, { type: 'ISC', url: 'dontcare' }] } as unknown as PackageJson)).toMatchInlineSnapshot(`"(MIT OR ISC)"`)
    })
  })

  describe('parseAuthor', () => {
    it('parses name only', () => {
      expect(parseAuthor('Anthony Fu')).toEqual({ name: 'Anthony Fu' })
    })
    it('parses name + email', () => {
      expect(parseAuthor('Anthony Fu <anthony@example.com>')).toEqual({
        name: 'Anthony Fu',
        email: 'anthony@example.com',
      })
    })
    it('parses name + url', () => {
      expect(parseAuthor('Anthony Fu (https://github.com/antfu)')).toEqual({
        name: 'Anthony Fu',
        url: 'https://github.com/antfu',
      })
    })
    it('parses full triple', () => {
      expect(parseAuthor('Anthony Fu <anthony@example.com> (https://github.com/antfu)')).toEqual({
        name: 'Anthony Fu',
        email: 'anthony@example.com',
        url: 'https://github.com/antfu',
      })
    })
    it('parses email-only', () => {
      expect(parseAuthor('<anthony@example.com>')).toEqual({
        email: 'anthony@example.com',
      })
    })
  })

  describe('normalizePkgAuthors', () => {
    it('detects github handle from url', () => {
      expect(normalizePkgAuthors({
        author: 'Anthony Fu <anthony@example.com> (https://github.com/antfu)',
      } as PackageJson)).toMatchInlineSnapshot(`
        [
          {
            "avatar": "https://avatars.antfu.dev/gh/antfu",
            "github": "antfu",
            "type": "github",
          },
        ]
      `)
    })
    it('detects github handle from noreply email', () => {
      expect(normalizePkgAuthors({
        author: { name: 'X', email: '12345+x@users.noreply.github.com' },
      } as PackageJson)).toMatchInlineSnapshot(`
        [
          {
            "avatar": "https://avatars.antfu.dev/gh/x",
            "github": "x",
            "type": "github",
          },
        ]
      `)
    })
    it('falls back to text type for plain authors', () => {
      expect(normalizePkgAuthors({
        author: 'John-David Dalton <john.david.dalton@gmail.com>',
      } as PackageJson)).toMatchInlineSnapshot(`
        [
          {
            "email": "john.david.dalton@gmail.com",
            "name": "John-David Dalton",
            "type": "text",
            "url": undefined,
          },
        ]
      `)
    })
    it('preserves url for text-type authors when not a github user url', () => {
      expect(normalizePkgAuthors({
        author: 'Jane Doe (https://example.com)',
      } as PackageJson)).toMatchInlineSnapshot(`
        [
          {
            "email": undefined,
            "name": "Jane Doe",
            "type": "text",
            "url": "https://example.com",
          },
        ]
      `)
    })
    it('infers single maintainer from repo url when no authors set', () => {
      expect(normalizePkgAuthors({
        repository: 'github:foo/bar',
      } as PackageJson)).toMatchInlineSnapshot(`
        [
          {
            "avatar": "https://avatars.antfu.dev/gh/foo",
            "github": "foo",
            "inferred": true,
            "type": "github",
          },
        ]
      `)
    })
    it('enriches a single text-only author with the repo org', () => {
      expect(normalizePkgAuthors({
        author: 'Anthony Fu',
        repository: 'github:antfu/whatever',
      } as PackageJson)).toMatchInlineSnapshot(`
        [
          {
            "avatar": "https://avatars.antfu.dev/gh/antfu",
            "github": "antfu",
            "inferred": true,
            "type": "github",
          },
        ]
      `)
    })
    it('does not enrich when multiple authors are present', () => {
      const result = normalizePkgAuthors({
        authors: ['Alice', 'Bob'],
        repository: 'github:foo/bar',
      } as PackageJson)
      expect(result).toHaveLength(2)
      expect(result?.every(a => a.type === 'text')).toBe(true)
    })
    it('returns undefined when no authors and no repository', () => {
      expect(normalizePkgAuthors({} as PackageJson)).toBeUndefined()
    })
  })
})
