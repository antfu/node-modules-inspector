import type { PackageNode } from 'node-modules-tools'
import type { DepUpgradeAction, MaintainerActionItem, PublintAction } from '../state/maintainer-actions'
import { formatMessage } from 'publint/utils'
import { getMajor } from 'verkit'
import { parseSemverRange } from './semver'

function safeMajor(version: string | undefined): number | undefined {
  if (!version)
    return undefined
  try {
    return getMajor(version)
  }
  catch {
    return undefined
  }
}

function rangeHighestMajor(range: string): number | undefined {
  const parsed = parseSemverRange(range)
  if (!parsed.valid || !parsed.highest)
    return undefined
  return safeMajor(parsed.highest)
}

function fromLabel(declaredRange: string): string {
  const major = rangeHighestMajor(declaredRange)
  return major !== undefined ? `v${major}` : `\`${declaredRange}\``
}

function toLabel(installedHighestVersion: string): string {
  const major = safeMajor(installedHighestVersion)
  return major !== undefined ? `v${major}` : `v${installedHighestVersion}`
}

function block(item: DepUpgradeAction): string {
  return item.depType === 'peer' ? 'peerDependencies' : 'dependencies'
}

function compatGuidance(item: DepUpgradeAction): string {
  const fromMajor = rangeHighestMajor(item.declaredRange)
  const toMajor = safeMajor(item.installedHighestVersion)
  const unionExample = fromMajor !== undefined && toMajor !== undefined
    ? `\`^${fromMajor} || ^${toMajor}\``
    : 'a union of both majors'
  if (item.depType === 'peer')
    return `widen \`${block(item)}.${item.depName}\` to a union (e.g. ${unionExample}) so consumers on either major are supported.`
  const newOnlyExample = toMajor !== undefined ? `\`^${toMajor}.0.0\`` : 'the new major'
  return `update \`${block(item)}.${item.depName}\` to accept ${toLabel(item.installedHighestVersion)} — ${unionExample} for backward compat, or ${newOnlyExample} for a clean bump.`
}

function depUrls(item: DepUpgradeAction): string[] {
  const depResolved = item.installedHighest.resolved
  const repository = depResolved.repository?.url
  const homepage = depResolved.packageJson.homepage
  const urls: string[] = []
  if (repository)
    urls.push(`Repository: ${repository}`)
  if (homepage && homepage !== repository)
    urls.push(`Docs: ${homepage}`)
  return urls
}

export function buildAgentPrompt(item: DepUpgradeAction): string {
  const lines: string[] = [
    `Update \`${block(item)}.${item.depName}\` in \`${item.consumer.name}\`: ${fromLabel(item.declaredRange)} → ${toLabel(item.installedHighestVersion)} (target \`${item.depName}@${item.installedHighestVersion}\`).`,
  ]
  const urls = depUrls(item)
  if (urls.length)
    lines.push('', ...urls)
  lines.push(
    '',
    `- Review \`${item.depName}\`'s changelog for breaking changes between ${fromLabel(item.declaredRange)} and ${toLabel(item.installedHighestVersion)}.`,
    `- If none affect this package, ${compatGuidance(item)}`,
    `- Otherwise pause and ask the user before changing the declaration.`,
    `- Verify with the test suite, lint, and type checks.`,
  )
  return lines.join('\n')
}

function formatPublintLine(msg: PublintAction['messages'][number], pkg: PackageNode): string {
  const text = (formatMessage(msg, pkg.resolved.packageJson) ?? msg.code).replace(/\s+/g, ' ').trim()
  return `- [${msg.type}] ${msg.code} — ${text}`
}

function publintSection(items: PublintAction[], consumerName: string): string[] {
  const total = items.reduce((acc, p) => acc + p.messages.length, 0)
  const lines: string[] = [
    `Address ${total} publint ${total === 1 ? 'finding' : 'findings'} in \`${consumerName}\`:`,
    '',
  ]
  for (const action of items) {
    for (const msg of action.messages)
      lines.push(formatPublintLine(msg, action.consumer))
  }
  return lines
}

export function buildPublintPrompt(item: PublintAction): string {
  const repository = item.consumer.resolved.repository?.url
  const lines = publintSection([item], item.consumer.name)
  if (repository)
    lines.splice(1, 0, `Repository: ${repository}`, '')
  return lines.join('\n')
}

export function buildAgentPromptAll(consumer: PackageNode, items: MaintainerActionItem[]): string {
  const depItems = items.filter((i): i is DepUpgradeAction => i.kind === 'dep-upgrade')
  const publintItems = items.filter((i): i is PublintAction => i.kind === 'publint')

  const lines: string[] = []

  if (publintItems.length)
    lines.push(...publintSection(publintItems, consumer.name))

  if (depItems.length) {
    if (lines.length)
      lines.push('')
    const hasPeer = depItems.some(i => i.depType === 'peer')
    const hasProd = depItems.some(i => i.depType === 'prod')
    const mix = hasPeer && hasProd ? 'peer and direct' : hasPeer ? 'peer' : 'direct'
    lines.push(
      `Update ${depItems.length} ${mix} ${depItems.length === 1 ? 'dependency' : 'dependencies'} in \`${consumer.name}\`:`,
      '',
      ...depItems.map(i => `- \`${block(i)}.${i.depName}\`: ${fromLabel(i.declaredRange)} → ${toLabel(i.installedHighestVersion)} (\`${i.depName}@${i.installedHighestVersion}\`)`),
      '',
      `For each: check the changelog, widen (peer) or update (direct) the range when no breaking change affects this package, otherwise pause and ask the user.`,
    )
  }

  lines.push('', `Verify with the test suite, lint, and type checks.`)

  return lines.join('\n')
}
