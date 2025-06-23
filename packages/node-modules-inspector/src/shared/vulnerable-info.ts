import type { AuditLevelString, NpmMeta } from 'node-modules-tools'
import type { ListPackagesNpmMetaOptions } from './types'
import pLimit from 'p-limit'
import { satisfies } from 'semver'

interface AuditReport {
  id: string
  url: string
  title: string
  severity: AuditLevelString
  vulnerable_versions: string
  cwe: string[]
  cvss: any
}

interface ResolvedVulnerability {
  name: string
  title: string
  version: string
  url: string
  level: AuditLevelString
}

const AuditLevel: Record<AuditLevelString, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
}

const registry = 'https://registry.npmjs.org'

async function getVulnerabilitiesBatch(dependencies: string[]): Promise<(ResolvedVulnerability | null)[]> {
  const payload = {} as Record<string, Set<string>>
  const dependencyInfo = [] as { name: string, version: string }[]
  for (const dependency of dependencies) {
    const depVersionIndex = dependency.indexOf('@', 1)
    const depName = dependency.slice(0, depVersionIndex).replace(/\//g, '__')
    const depVersion = dependency.slice(depVersionIndex + 1)
    dependencyInfo.push({ name: depName, version: depVersion })
    if (payload[depName]) {
      payload[depName].add(depVersion)
    }
    else {
      payload[depName] = new Set([depVersion])
    }
  }
  const body = {} as Record<string, string[]>
  for (const depName in payload) {
    body[depName] = Array.from(payload[depName])
  }
  const result = await fetch(`${registry}/-/npm/v1/security/advisories/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'no-cors',
    body: JSON.stringify(body),
  })
  if (!result.ok) {
    throw new Error(`Failed to fetch vulnerabilities: ${result.status} ${result.statusText}`)
  }
  const report = (await result.json()) as Record<string, AuditReport[]>
  return dependencyInfo.map(({ name, version }) => {
    let highestVulnerability: ResolvedVulnerability | null = null
    if (!report[name]) {
      return null
    }
    report[name].forEach((vulnerability) => {
      const isVulnerable = satisfies(version, vulnerability.vulnerable_versions)
      const level = AuditLevel[vulnerability.severity]
      if (isVulnerable && (!highestVulnerability || level > AuditLevel[highestVulnerability.level])) {
        highestVulnerability = {
          name,
          version,
          title: vulnerability.title,
          url: vulnerability.url,
          level: vulnerability.severity,
        }
      }
    })
    return highestVulnerability
  })
}

async function fetchBatch(
  specs: string[],
  onResult: (result: ResolvedVulnerability) => void,
) {
  const promises: Promise<void>[] = []
  const missingSpecs = new Set<string>()
  const BATCH_SIZE = 100
  const limit = pLimit(100)

  for (let i = 0; i < specs.length; i += BATCH_SIZE) {
    const queue = specs.slice(i, i + BATCH_SIZE)
    promises.push(limit(async () => {
      try {
        const result = await getVulnerabilitiesBatch(queue)
        Object.entries(result).forEach(([_, r], idx) => {
          if (r !== null) {
            onResult(r)
          }
          else {
            missingSpecs.add(queue[idx])
          }
        })
      }
      catch {
        for (const spec of queue)
          missingSpecs.add(spec)
      }
    }))
  }

  await Promise.all(promises)

  // If batch failed, try to get publish date one by one
  if (missingSpecs.size) {
    await Promise.all(
      Array.from(missingSpecs).map(spec => limit(async () => {
        try {
          const result = await getVulnerabilitiesBatch([spec])
          if (result[0] !== null) {
            onResult(result[0])
          }
          if ('publishedAt' in result && result.publishedAt) {
            missingSpecs.delete(spec)
          }
        }
        catch { }
      })),
    )
  }

  return {
    missing: missingSpecs,
  }
}

export async function addPackagesNpmVulnerabilityMeta(
  packages: string[],
  options: ListPackagesNpmMetaOptions,
) {
  const { storageNpmMeta: storage } = options

  const map = new Map<string, any>()
  const unknown = packages
  const {
    missing,
  } = await fetchBatch(unknown, async (r) => {
    const spec = `${r.name}@${r.version}`
    const oldMeta = await storage.getItem(spec)
    if (oldMeta) {
      const meta: NpmMeta = {
        ...oldMeta,
        vulnerability: {
          title: r.title,
          url: r.url,
          level: r.level,
        },
      }
      map.set(spec, meta)
      await storage.setItem(spec, meta)
    }
  })

  if (missing.size) {
    console.warn('Failed to get npm meta for:', [...missing])
  }
}
