import semver from 'semver'

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

  if (!semver.validRange(range)) {
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
  if (!semver.valid(highest) || !semver.valid(lowest)) {
    return result
  }

  result.valid = true
  result.highest = highest
  result.lowest = lowest
  result.parts = parts
  result.bare = partsBare
  return result
}

function compareSemver(a: string, b: string) {
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
