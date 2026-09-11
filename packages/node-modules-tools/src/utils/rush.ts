import fs from 'node:fs'
import { dirname, join, parse } from 'pathe'

/**
 * Check if the given directory is inside a Rush monorepo.
 *
 * Rush monorepos are identified by the presence of a `rush.json` file
 * at the monorepo root. This function traverses up from `cwd` to find it.
 *
 * @see https://rushjs.io/pages/maintainer/setup_new_repo/
 */
export function isRushMonorepo(cwd: string): boolean {
  return !!findRushRoot(cwd)
}

/**
 * Find the Rush monorepo root directory by traversing up from `cwd`.
 *
 * @returns The directory containing `rush.json`, or `undefined` if not in a Rush monorepo.
 */
export function findRushRoot(cwd: string): string | undefined {
  let dir = cwd
  const { root } = parse(dir)

  while (dir && dir !== root) {
    if (fs.existsSync(join(dir, 'rush.json')))
      return dir
    dir = dirname(dir)
  }

  return undefined
}
