import type { MaintainersGroupDto } from '../../shared/reports/dto'
import c from 'ansis'

function authorLabel(author: MaintainersGroupDto['authors'][number]): string {
  if (author.type === 'github')
    return `@${author.github}`
  return author.name
}

function formatGroup(group: MaintainersGroupDto): string {
  const header = `${c.bold(group.consumer.name)} ${c.dim(`v${group.consumer.version} · depth ${group.consumer.depth}`)}`
  const authors = group.authors.length
    ? c.dim(`  by ${group.authors.map(authorLabel).join(', ')}`)
    : ''

  const lines: string[] = []
  for (const item of group.items) {
    if (item.kind === 'publint') {
      const counts = item.counts
      const parts: string[] = []
      if (counts.error)
        parts.push(c.red(`${counts.error} error${counts.error === 1 ? '' : 's'}`))
      if (counts.warning)
        parts.push(c.yellow(`${counts.warning} warning${counts.warning === 1 ? '' : 's'}`))
      if (counts.suggestion)
        parts.push(c.blue(`${counts.suggestion} suggestion${counts.suggestion === 1 ? '' : 's'}`))
      lines.push(`  ${c.magenta('publint')}  ${parts.join(', ')}`)
    }
    else {
      const ratio = item.totalCount
        ? `${item.migratedCount}/${item.totalCount} (${Math.round(item.migrationRatio * 100)}%)`
        : '—'
      const type = item.depType === 'peer' ? c.cyan('peer') : c.green('prod')
      const catalog = item.catalogName ? c.dim(` catalog:${item.catalogName}`) : ''
      lines.push(`  ${type}  ${c.bold(item.depName)} ${c.dim(item.declaredRange)} → ${c.green(`v${item.installedHighestVersion}`)}${catalog}  ${c.dim(`migration ${ratio}`)}`)
    }
  }

  return [header, authors, ...lines].filter(Boolean).join('\n')
}

export function formatMaintainers(groups: MaintainersGroupDto[]): string {
  if (!groups.length)
    return c.green('No maintainer actions found.\n')

  const blocks = groups.map(formatGroup).join('\n\n')
  const summary = c.dim(`\n${groups.length} consumer${groups.length === 1 ? '' : 's'} with actions\n`)
  return `${blocks}\n${summary}`
}
