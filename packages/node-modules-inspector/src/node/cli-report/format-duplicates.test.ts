import type { DuplicatesEntry } from '../../shared/reports/dto'
import { describe, expect, it } from 'vitest'
import { formatDuplicates } from './format-duplicates'
import { stripAnsi } from './format-util'

describe('formatDuplicates', () => {
  it('renders empty state', () => {
    expect(stripAnsi(formatDuplicates([]))).toMatchInlineSnapshot(`
      "No duplicated packages found.
      "
    `)
  })

  it('renders a populated table', () => {
    const entries: DuplicatesEntry[] = [
      {
        name: '@typescript-eslint/scope-manager',
        versions: ['8.56.1', '8.59.1', '8.59.2', '8.59.4'],
        specs: [
          '@typescript-eslint/scope-manager@8.56.1',
          '@typescript-eslint/scope-manager@8.59.1',
          '@typescript-eslint/scope-manager@8.59.2',
          '@typescript-eslint/scope-manager@8.59.4',
        ],
      },
      {
        name: 'esbuild',
        versions: ['0.27.7', '0.28.0'],
        specs: ['esbuild@0.27.7', 'esbuild@0.28.0'],
      },
    ]
    expect(stripAnsi(formatDuplicates(entries))).toMatchInlineSnapshot(`
      "Package                           #  Versions
      ────────────────────────────────  ─  ──────────────────────────────────
      @typescript-eslint/scope-manager  4  v8.56.1, v8.59.1, v8.59.2, v8.59.4
      esbuild                           2  v0.27.7, v0.28.0

      2 packages with multiple versions
      "
    `)
  })

  it('renders singular summary for one entry', () => {
    const entries: DuplicatesEntry[] = [
      { name: 'foo', versions: ['1.0.0', '2.0.0'], specs: ['foo@1.0.0', 'foo@2.0.0'] },
    ]
    expect(stripAnsi(formatDuplicates(entries))).toContain('1 package with multiple versions')
  })
})
