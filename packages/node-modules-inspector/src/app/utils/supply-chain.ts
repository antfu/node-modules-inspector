import type { NpmMeta } from 'node-modules-tools'

/**
 * The three supply-chain signals npm exposes, in the order they are counted.
 */
export const SUPPLY_CHAIN_SIGNALS = ['Provenance', 'Trusted Publisher', 'Staged Publish']

/**
 * How many of the three supply-chain signals (provenance attestation, trusted
 * publisher, staged publish) a package carries. `0` means none of them, or that
 * there is no npm meta for it at all.
 */
export function getSupplyChainScore(meta: NpmMeta | null | undefined): number {
  let score = 0
  if (meta?.provenance)
    score++
  if (meta?.trustedPublisher)
    score++
  if (meta?.staged)
    score++
  return score
}
