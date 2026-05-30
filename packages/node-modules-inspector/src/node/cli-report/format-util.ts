import c from 'ansis'

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatBytes(bytes: number): string {
  if (bytes === 0)
    return '0 B'
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit++
  }
  const precision = value < 10 ? 2 : value < 100 ? 1 : 0
  return `${value.toFixed(precision)} ${UNITS[unit]}`
}

const ESC = String.fromCharCode(0x1B)
const ANSI_RE = new RegExp(`${ESC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\[[0-9;]*m`, 'g')

export function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, '')
}

export function visualWidth(s: string): number {
  return stripAnsi(s).length
}

export function padRight(s: string, width: number): string {
  const diff = width - visualWidth(s)
  return diff > 0 ? s + ' '.repeat(diff) : s
}

export function padLeft(s: string, width: number): string {
  const diff = width - visualWidth(s)
  return diff > 0 ? ' '.repeat(diff) + s : s
}

export type Alignment = 'left' | 'right'

export interface Column {
  header: string
  align?: Alignment
}

export function renderTable(columns: Column[], rows: string[][]): string {
  const widths: number[] = columns.map((col, i) => {
    let max = visualWidth(col.header)
    for (const row of rows)
      max = Math.max(max, visualWidth(row[i] ?? ''))
    return max
  })

  const lastIndex = columns.length - 1
  const pad = (s: string, i: number): string => {
    const align = columns[i]?.align
    const width = widths[i] ?? 0
    if (align === 'right')
      return padLeft(s, width)
    // Skip right-padding the last left-aligned column to avoid trailing whitespace.
    if (i === lastIndex)
      return s
    return padRight(s, width)
  }

  const headerLine = columns.map((col, i) => c.bold(pad(col.header, i))).join('  ')
  const rule = widths.map(w => c.dim('─'.repeat(w))).join('  ')
  const rowLines = rows.map(r => r.map((cell, i) => pad(cell ?? '', i)).join('  '))

  return [headerLine, rule, ...rowLines].join('\n')
}

export function section(title: string, body: string): string {
  return `${c.bold.cyan(title)}\n${body}\n`
}
