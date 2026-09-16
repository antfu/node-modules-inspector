import type { NpmMeta } from 'node-modules-tools'

/**
 * How many of the three supply-chain signals (provenance attestation, trusted
 * publisher, staged publish) a package carries. `0` means none of them, or that
 * there is no npm meta for it at all.
 *
 * The score itself is calculated node-side (see `getSupplyChainScore` in
 * `node-modules-tools`) and attached to the npm meta before it reaches the
 * client; this just reads that precomputed value.
 */
export function getSupplyChainScore(meta: NpmMeta | null | undefined): number {
  return meta?.supplyChainScore ?? 0
}
