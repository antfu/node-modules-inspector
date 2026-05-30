import type { SizesEntry } from '../../shared/reports/dto'
import c from 'ansis'
import { formatBytes, renderTable } from './format-util'

function topCategory(entry: SizesEntry): string {
  const categories = entry.categories
  let bestKey: string | undefined
  let bestBytes = 0
  for (const [key, value] of Object.entries(categories)) {
    if (!value)
      continue
    if (value.bytes > bestBytes) {
      bestBytes = value.bytes
      bestKey = key
    }
  }
  if (!bestKey)
    return ''
  const pct = entry.bytes ? Math.round((bestBytes / entry.bytes) * 100) : 0
  return `${bestKey} ${c.dim(`(${pct}%)`)}`
}

export function formatSizes(entries: SizesEntry[]): string {
  if (!entries.length)
    return c.dim('No install-size data available.\n')

  const rows = entries.map(e => [
    e.spec,
    formatBytes(e.bytes),
    topCategory(e),
  ])

  const table = renderTable([
    { header: 'Package' },
    { header: 'Size', align: 'right' },
    { header: 'Largest file type' },
  ], rows)

  const total = entries.reduce((sum, e) => sum + e.bytes, 0)
  const summary = c.dim(`\n${entries.length} package${entries.length === 1 ? '' : 's'} · total ${formatBytes(total)}\n`)
  return `${table}\n${summary}`
}
