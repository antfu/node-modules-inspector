import { compare } from 'verkit'

export function compareSemver(a: string, b: string): number {
  if (a === b)
    return 0
  try {
    return compare(a, b)
  }
  catch (e) {
    console.error('Failed to compare semver ', e)
    return 0
  }
}
