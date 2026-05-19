import type { PackageNode } from 'node-modules-tools'
import type { DepUpgradeAction, MaintainerActionItem, PublintAction } from '../state/maintainer-actions'
import { formatMessage } from 'publint/utils'
import semver from 'semver'
import { getPackageData } from './package-json'
import { parseSemverRange } from './semver'

function safeMajor(version: string | undefined): number | undefined {
  if (!version)
    return undefined
  try {
    return semver.major(version)
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

function describeCurrentVersion(declaredRange: string): string {
  const major = rangeHighestMajor(declaredRange)
  return major !== undefined ? `v${major}` : `\`${declaredRange}\``
}

function urlBlock(item: DepUpgradeAction): string[] {
  const depData = getPackageData(item.installedHighest)
  const urls: string[] = []
  if (depData.repository)
    urls.push(`\`${item.depName}\` repository: ${depData.repository}`)
  if (depData.homepage && depData.homepage !== depData.repository)
    urls.push(`\`${item.depName}\` docs: ${depData.homepage}`)
  return urls
}

export function buildAgentPrompt(item: DepUpgradeAction): string {
  const block = item.depType === 'peer' ? 'peerDependencies' : 'dependencies'
  const fromLabel = describeCurrentVersion(item.declaredRange)
  const fromMajor = rangeHighestMajor(item.declaredRange)
  const toMajor = safeMajor(item.installedHighestVersion)
  const toLabel = toMajor !== undefined ? `v${toMajor}` : `v${item.installedHighestVersion}`
  const unionExample = fromMajor !== undefined && toMajor !== undefined
    ? `\`^${fromMajor} || ^${toMajor}\``
    : 'a union of the current and target majors'
  const newOnlyExample = toMajor !== undefined ? `\`^${toMajor}.0.0\`` : `the new major`

  const intent = item.depType === 'peer'
    ? `\`${item.depName}\` is declared as a peer dependency — it signals compatibility to downstream consumers. The goal is to broaden that compatibility, not necessarily to drop the old major.`
    : `\`${item.depName}\` is a direct dependency. The goal is to upgrade to ${toLabel}.`

  const compatBullet = item.depType === 'peer'
    ? `- If no breaking change affects this package, widen \`${block}.${item.depName}\` to a union (e.g. ${unionExample}) so consumers on either major are still supported.`
    : `- If no breaking change affects this package, update \`${block}.${item.depName}\` to allow ${toLabel}. A union (${unionExample}) keeps backward compat; a clean bump to ${newOnlyExample} is simpler if older support is not needed.`

  const lines: string[] = [
    `Update \`${item.depName}\` in \`${item.consumer.name}\` from ${fromLabel} to ${toLabel} (specifically \`${item.depName}@${item.installedHighestVersion}\`).`,
  ]

  const urls = urlBlock(item)
  if (urls.length)
    lines.push('', ...urls)

  lines.push(
    '',
    intent,
    '',
    `- Review \`${item.depName}\`'s changelog between ${fromLabel} and ${toLabel} to identify breaking changes.`,
    compatBullet,
    `- If a breaking change does affect this package, do not change the declaration unilaterally — pause and ask the user how to proceed (e.g. drop the old major and bump, fork compatibility, etc.).`,
    `- Verify the update by running the test suite, linting, and type checks.`,
  )

  return lines.join('\n')
}

function formatPublintLine(msg: PublintAction['messages'][number], pkg: PackageNode): string {
  const text = (formatMessage(msg, pkg.resolved.packageJson) ?? msg.code).replace(/\s+/g, ' ').trim()
  return `- [${msg.type}] ${msg.code} — ${text}`
}

export function buildPublintPrompt(item: PublintAction): string {
  const lines: string[] = [
    `Address publint findings in \`${item.consumer.name}\`.`,
  ]
  lines.push('', `Findings (${item.messages.length}):`)
  for (const msg of item.messages)
    lines.push(formatPublintLine(msg, item.consumer))
  return lines.join('\n')
}

export function buildAgentPromptAll(consumer: PackageNode, items: MaintainerActionItem[]): string {
  const depItems = items.filter((i): i is DepUpgradeAction => i.kind === 'dep-upgrade')
  const publintItems = items.filter((i): i is PublintAction => i.kind === 'publint')

  const lines: string[] = []

  if (depItems.length) {
    const hasPeer = depItems.some(i => i.depType === 'peer')
    const hasProd = depItems.some(i => i.depType === 'prod')
    const mix = hasPeer && hasProd ? 'peer and direct' : hasPeer ? 'peer' : 'direct'
    lines.push(
      `Update ${depItems.length} ${mix} ${depItems.length === 1 ? 'dependency' : 'dependencies'} in \`${consumer.name}\`:`,
      '',
      ...depItems.map((i) => {
        const block = i.depType === 'peer' ? 'peerDependencies' : 'dependencies'
        const fromMajor = rangeHighestMajor(i.declaredRange)
        const fromLabel = fromMajor !== undefined ? `v${fromMajor} (\`${i.declaredRange}\`)` : `\`${i.declaredRange}\``
        const toMajor = safeMajor(i.installedHighestVersion)
        const toLabel = toMajor !== undefined ? `v${toMajor} (\`${i.depName}@${i.installedHighestVersion}\`)` : `\`${i.depName}@${i.installedHighestVersion}\``
        return `- \`${block}.${i.depName}\`: ${fromLabel} → ${toLabel}`
      }),
    )
  }

  if (publintItems.length) {
    if (lines.length)
      lines.push('')
    const total = publintItems.reduce((acc, p) => acc + p.messages.length, 0)
    lines.push(
      `Address ${total} publint ${total === 1 ? 'finding' : 'findings'} in \`${consumer.name}\`:`,
      '',
    )
    for (const action of publintItems) {
      for (const msg of action.messages)
        lines.push(formatPublintLine(msg, action.consumer))
    }
  }

  if (depItems.length) {
    lines.push(
      '',
      `For each dep:`,
      `- Review its changelog between the current and target majors to identify breaking changes.`,
      `- If no breaking change affects this package:`,
      `  - For peer dependencies, widen the range to a union of the old and new majors.`,
      `  - For direct dependencies, update the range to accept the new major (union for backward compat, or a clean bump if older support is not needed).`,
      `- If a breaking change does affect this package, pause on that dep and ask the user how to proceed.`,
    )
  }

  lines.push(
    '',
    `After all updates, verify with the test suite, linting, and type checks.`,
  )

  return lines.join('\n')
}
