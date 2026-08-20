import type { SemVerComparator } from 'verkit'
import { isValidRange, parseRange } from 'verkit'
import { compareSemver } from '../../shared/semver'

export { compareSemver }

export interface ParsedSemver {
  valid: boolean
  raw: string
  highest?: string
  lowest?: string
  parts?: string[]
  bare?: string[]
}

const SemverParseCache = new Map<string, ParsedSemver>()

/** Reconstruct a `major.minor.patch(-prerelease)` string from a comparator. */
function comparatorVersion(comparator: SemVerComparator): string | null {
  const version = comparator.version
  if (!version || typeof version.major !== 'number')
    return null
  let str = `${version.major}.${version.minor}.${version.patch}`
  if (version.prerelease?.length)
    str += `-${version.prerelease.join('.')}`
  return str
}

/**
 * The representative lowest version of a single AND-group (comparator set),
 * e.g. `>=14.17.0 <15` → `14.17.0`. Ranges like `^1.2` are pre-expanded by
 * verkit into `>=1.2.0 <2.0.0-0`, so we take the greatest lower bound
 * (`>=`/`>`/`=`), falling back to the smallest version present.
 */
function setLowerBound(set: readonly SemVerComparator[]): string | null {
  const lowers: string[] = []
  const all: string[] = []
  for (const comparator of set) {
    const version = comparatorVersion(comparator)
    if (!version)
      continue
    all.push(version)
    // `>=`/`>` are lower bounds; `''` is an exact version (also a lower bound)
    if (comparator.operator === '>=' || comparator.operator === '>' || comparator.operator === '')
      lowers.push(version)
  }
  if (lowers.length)
    return lowers.slice().sort(compareSemver).at(-1)!
  if (all.length)
    return all.slice().sort(compareSemver)[0]!
  return null
}

export function parseSemverRange(range: string) {
  if (SemverParseCache.has(range))
    return SemverParseCache.get(range)!

  const result: ParsedSemver = {
    valid: false,
    raw: range,
  }
  SemverParseCache.set(range, result)

  if (!isValidRange(range))
    return result

  let sets: readonly (readonly SemVerComparator[])[]
  try {
    sets = parseRange(range).sets
  }
  catch {
    return result
  }

  // One representative (lowest) version per OR-alternative.
  const bare = sets
    .map(setLowerBound)
    .filter((v): v is string => !!v)
    .sort(compareSemver)

  if (!bare.length)
    return result

  result.valid = true
  result.lowest = bare[0]
  result.highest = bare.at(-1)
  result.bare = bare
  result.parts = range.split(/\|\|/g).map(i => i.trim())
  return result
}

export function compareSemverRange(a = '*', b = '*') {
  if (a === b)
    return 0
  const parsedA = parseSemverRange(a)
  const parsedB = parseSemverRange(b)
  const compare = compareSemver(parsedB.lowest || '*', parsedA.lowest || '*')
  if (compare !== 0)
    return compare
  return ((parsedB.parts?.length || 0) - (parsedA.parts?.length || 0))
}
