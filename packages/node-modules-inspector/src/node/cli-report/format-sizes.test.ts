import type { SizesEntry } from '../../shared/reports/dto'
import { describe, expect, it } from 'vitest'
import { formatSizes } from './format-sizes'
import { formatBytes, stripAnsi } from './format-util'

describe('formatBytes', () => {
  it('formats common ranges', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
    expect(formatBytes(23_237_120)).toBe('22.2 MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB')
  })
})

describe('formatSizes', () => {
  it('renders empty state', () => {
    expect(stripAnsi(formatSizes([]))).toMatchInlineSnapshot(`
      "No install-size data available.
      "
    `)
  })

  it('renders a populated table', () => {
    const entries: SizesEntry[] = [
      {
        spec: 'typescript@6.0.3',
        name: 'typescript',
        version: '6.0.3',
        workspace: false,
        bytes: 24_346_827,
        categories: {
          js: { bytes: 15_344_521, count: 200 },
          dts: { bytes: 7_002_306, count: 150 },
          other: { bytes: 2_000_000, count: 50 },
        },
      },
      {
        spec: 'esbuild@0.28.0',
        name: 'esbuild',
        version: '0.28.0',
        workspace: false,
        bytes: 10_678_299,
        categories: {
          bin: { bytes: 10_500_000, count: 1 },
          js: { bytes: 178_299, count: 10 },
        },
      },
    ]
    expect(stripAnsi(formatSizes(entries))).toMatchInlineSnapshot(`
      "Package              Size  Largest file type
      ────────────────  ───────  ─────────────────
      typescript@6.0.3  23.2 MB  js (63%)
      esbuild@0.28.0    10.2 MB  bin (98%)

      2 packages · total 33.4 MB
      "
    `)
  })
})
