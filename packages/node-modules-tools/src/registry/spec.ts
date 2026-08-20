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
 * Parse a whitespace-separated list of install specs
 * (e.g. `"vue@^3.4 react nuxt@latest"`) into a name-to-range record.
 */
export function parseInstallSpecs(input: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const token of input.split(/\s+/g)) {
    if (!token)
      continue
    const at = token.lastIndexOf('@')
    if (at > 0) {
      const name = token.slice(0, at)
      const range = token.slice(at + 1)
      result[name] = range || '*'
    }
    else {
      result[token] = '*'
    }
  }
  return result
}
