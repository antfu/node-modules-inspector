import type { MaintainerActionItem } from '../state/maintainer-actions'
import semver from 'semver'

function safeMajor(version: string): number {
  try {
    return semver.major(version)
  }
  catch {
    return 0
  }
}

export function buildAgentPrompt(item: MaintainerActionItem): string {
  const block = item.depType === 'peer' ? 'peerDependencies' : 'dependencies'
  return [
    `Update \`${item.consumer.name}\` so \`${block}.${item.depName}\` includes \`${item.depName}@${item.installedHighestVersion}\` (currently \`${item.declaredRange}\`).`,
    `- Widen the range in package.json (e.g. \`^${safeMajor(item.installedHighestVersion)}.0.0\` or a union of the current and new majors).`,
    `- Skim ${item.depName}'s changelog between majors and fix any breaking call sites.`,
    `- Run the test suite and open a PR.`,
  ].join('\n')
}
