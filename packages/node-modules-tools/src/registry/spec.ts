import { rangesIntersect } from 'verkit'

/**
 * Version-spec protocols that cannot be resolved from the npm registry alone.
 */
const UNSUPPORTED_SPEC_RE = /^(?:workspace|catalog|file|link|portal|git|git\+\w+|github|gist|bitbucket|gitlab|https?|jsr):/

/**
 * Check if a version spec can be resolved purely from the npm registry.
 * `npm:` aliases ARE supported (see {@link parseNpmAlias}).
 */
export function isRegistryResolvableSpec(spec: string): boolean {
  return !UNSUPPORTED_SPEC_RE.test(spec.trim())
}

/**
 * Parse an `npm:name@range` alias spec.
 * Returns the aliased target, or null if the spec is not an npm alias.
 */
export function parseNpmAlias(spec: string): { name: string, range: string } | null {
  if (!spec.startsWith('npm:'))
    return null
  const body = spec.slice(4)
  const at = body.lastIndexOf('@')
  if (at > 0)
    return { name: body.slice(0, at), range: body.slice(at + 1) || '*' }
  return { name: body, range: '*' }
}

/**
 * A single exclude spec parsed from a `-`-prefixed token.
 */
export interface InstallExcludeSpec {
  /** Package name or wildcard pattern (e.g. `vite`, `@nuxt/kit`, `*eslint*`) */
  name: string
  /** Version range to match against, or `*` for any version */
  range: string
}

/**
 * The result of parsing an install-spec input string.
 */
export interface ParsedInstallSpecs {
  /** Packages to inspect, name to version range */
  dependencies: Record<string, string>
  /** Packages (and their exclusively-reachable deps) to exclude */
  excludes: InstallExcludeSpec[]
}

/**
 * Split a single `name@range` token into its name and range.
 * Splits on the last `@` so scoped names (`@foo/bar`) are preserved.
 */
function parseSpecToken(token: string): { name: string, range: string } {
  const at = token.lastIndexOf('@')
  if (at > 0)
    return { name: token.slice(0, at), range: token.slice(at + 1) || '*' }
  return { name: token, range: '*' }
}

/**
 * Parse a whitespace-separated list of install specs
 * (e.g. `"vue@^3.4 react nuxt@latest"`) into packages to inspect and,
 * for any `-`-prefixed token (e.g. `"nuxt -@nuxt/kit -vite@5"`), packages
 * to exclude from the resolved graph.
 */
export function parseInstallSpecs(input: string): ParsedInstallSpecs {
  const dependencies: Record<string, string> = {}
  const excludes: InstallExcludeSpec[] = []
  for (const token of input.split(/\s+/g)) {
    if (!token)
      continue
    if (token.startsWith('-')) {
      // `-@nuxt/kit`, `-vite`, `-vite@5`, `-*eslint*`
      const body = token.slice(1)
      if (!body)
        continue
      excludes.push(parseSpecToken(body))
    }
    else {
      const { name, range } = parseSpecToken(token)
      dependencies[name] = range
    }
  }
  return { dependencies, excludes }
}

/**
 * Build a predicate that tests whether a `name@range` dependency edge should
 * be excluded from resolution, given a list of exclude specs.
 *
 * Matching is done WITHOUT resolving a concrete version (so an excluded
 * package's metadata is never fetched):
 * - the name is matched exactly, or by wildcard (`*eslint*`, `bar-*`)
 * - a ranged exclude (`vite@5`) matches when its range intersects the
 *   requested range; a bare exclude (`vite`, `vite@*`) matches any range
 */
export function constructExcludeMatcher(
  excludes: InstallExcludeSpec[],
): (name: string, range: string) => boolean {
  if (!excludes.length)
    return () => false

  const matchers = excludes.map((exclude) => {
    const hasWildcard = exclude.name.includes('*')
    const nameMatch: RegExp | string = hasWildcard
      ? new RegExp(`^${Array.from(exclude.name).map(char => char === '*' ? '.*' : char === '.' ? '\\.' : char).join('')}$`)
      : exclude.name
    return { nameMatch, range: exclude.range }
  })

  return (name, range) => matchers.some(({ nameMatch, range: excludeRange }) => {
    const isNameMatch = nameMatch instanceof RegExp ? nameMatch.test(name) : name === nameMatch
    if (!isNameMatch)
      return false
    if (excludeRange === '*' || range === '*' || range === 'x' || !range)
      return true
    try {
      return rangesIntersect(excludeRange, range)
    }
    catch {
      // Non-semver requested range (dist-tag, etc.) — fall back to name match
      return true
    }
  })
}
