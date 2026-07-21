import { isValid, isValidRange } from 'verkit'
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

export function parseSemverRange(range: string) {
  if (SemverParseCache.has(range))
    return SemverParseCache.get(range)!

  const result: ParsedSemver = {
    valid: false,
    raw: range,
  }
  SemverParseCache.set(range, result)

  if (!isValidRange(range)) {
    return result
  }

  const parts = range
    .split(/\|\|/g)
    .map(i => i.replace(/\s+/g, '').replace(/(\.[0x*])+$/g, ''))

  const partsBare = parts
    .map(i => i.replace(/^(?:\^|>=|>)/g, '').replace(/\.[*x]$/, '').trim())
    .map((i) => {
      const parts = i.split(/\./)
      if (parts.length === 1)
        return `${i}.0.0`
      if (parts.length === 2)
        return `${i}.0`
      return i
    })
    .sort(compareSemver)

  const highest = partsBare.at(-1)!
  const lowest = partsBare.at(0)!
  if (!isValid(highest) || !isValid(lowest)) {
    return result
  }

  result.valid = true
  result.highest = highest
  result.lowest = lowest
  result.parts = parts
  result.bare = partsBare
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
