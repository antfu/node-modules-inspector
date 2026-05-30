import type { DuplicatesEntry } from '../../shared/reports/dto'
import c from 'ansis'
import { renderTable } from './format-util'

export function formatDuplicates(entries: DuplicatesEntry[]): string {
  if (!entries.length)
    return c.green('No duplicated packages found.\n')

  const rows = entries.map(e => [
    e.name,
    String(e.versions.length),
    e.versions.map(v => `v${v}`).join(', '),
  ])

  const table = renderTable([
    { header: 'Package' },
    { header: '#', align: 'right' },
    { header: 'Versions' },
  ], rows)

  const summary = c.dim(`\n${entries.length} package${entries.length === 1 ? '' : 's'} with multiple versions\n`)
  return `${table}\n${summary}`
}
