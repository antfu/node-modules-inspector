import semver from 'semver'

export function compareSemver(a: string, b: string): number {
  if (a === b)
    return 0
  try {
    return semver.compare(a, b)
  }
  catch (e) {
    console.error('Failed to compare semver ', e)
    return 0
  }
}
