import type { ListPackageDependenciesOptions, PackageNode, PublintMessage } from 'node-modules-tools'
import type { Storage } from 'unstorage'
import type { ListPackagesNpmMetaLatestOptions, ListPackagesNpmMetaOptions, NodeModulesInspectorConfig, NodeModulesInspectorPayload, ServerFunctions } from '../shared/types'
import process from 'node:process'
import c from 'ansis'
import { constructPackageFilters, listPackageDependencies } from 'node-modules-tools'
import { hash as getHash } from 'ohash'
import pLimit from 'p-limit'
import { loadConfig } from 'unconfig'
import { isNpmMetaLatestValid } from '../shared/utils'
import {
  getPackagesNpmMeta as _getPackagesNpmMeta,
  getPackagesNpmMetaLatest as _getPackagesNpmMetaLatest,
} from '../shared/version-info'
import { MARK_CHECK, MARK_NODE } from './constants'

export interface CreateServerFunctionsOptions extends
  Partial<ListPackageDependenciesOptions>,
  ListPackagesNpmMetaOptions,
  ListPackagesNpmMetaLatestOptions {
  mode: 'dev' | 'build'
  storagePublint?: Storage<PublintMessage[]>
  configFile?: string
}

export function createServerFunctions(options: CreateServerFunctionsOptions): ServerFunctions {
  let _config: Promise<NodeModulesInspectorConfig> | null = null
  let _payload: Promise<NodeModulesInspectorPayload> | null = null

  async function getConfig(force = false) {
    if (force)
      _config = null
    if (!_config)
      _config = _getConfig()
    return _config
  }

  async function _getConfig() {
    const result = await loadConfig<NodeModulesInspectorConfig>({
      cwd: options.cwd,
      sources: [
        {
          files: options.configFile || 'node-modules-inspector.config',
        },
      ],
      defaults: {
        fetchNpmMeta: true,
        publint: false,
      },
      merge: true,
    })
    if (result.sources.length)
      console.log(c.green`${MARK_CHECK} Config loaded from ${result.sources.join(', ')}`)
    return result.config
  }

  async function getPackagesNpmMeta(specs: string[], log = true) {
    const config = await getConfig()
    if (!config.fetchNpmMeta)
      return new Map()
    if (log)
      console.log(c.cyan`${MARK_NODE} Fetching npm meta for ${specs.length} packages...`)
    const result = await _getPackagesNpmMeta(specs, { storageNpmMeta: options.storageNpmMeta })
    if (log)
      console.log(c.green`${MARK_CHECK} npm meta fetched for ${specs.length} packages`)
    return result
  }

  async function getPackagesNpmMetaLatest(pkgNames: string[], log = true) {
    const config = await getConfig()
    if (!config.fetchNpmMeta)
      return new Map()
    if (log)
      console.log(c.cyan`${MARK_NODE} Fetching npm meta latest for ${pkgNames.length} packages...`)
    const result = await _getPackagesNpmMetaLatest(pkgNames, { storageNpmMetaLatest: options.storageNpmMetaLatest })
    if (log)
      console.log(c.green`${MARK_CHECK} npm meta latest fetched for ${pkgNames.length} packages`)
    return result
  }

  async function getPublint(pkg: Pick<PackageNode, 'private' | 'workspace' | 'spec' | 'filepath'>, log = true) {
    if (pkg.workspace || pkg.private)
      return null
    if (log)
      console.log(c.cyan`${MARK_NODE} Running publint for ${pkg.spec}...`)
    try {
      let result = await options.storagePublint?.getItem(pkg.spec) || undefined
      const { publint } = await import('publint')
      if (!result) {
        result = await publint({
          pack: false,
          pkgDir: pkg.filepath,
          strict: false,
        }).then(r => r.messages) || []
        await options.storagePublint?.setItem(pkg.spec, result)
      }
      if (log)
        console.log(c.green`${MARK_CHECK} Publint for ${pkg.spec} finished with ${result.length} messages`)
      return result
    }
    catch (e) {
      console.error(c.red`${MARK_NODE} Failed to run publint for ${pkg.spec}`)
      console.error(e)
      return null
    }
  }

  function getPayload(force?: boolean) {
    if (force) {
      _config = null
      _payload = null
    }
    if (!_payload)
      _payload = _getPayload()
    return _payload
  }

  async function _getPayload() {
    const config = await getConfig()
    const excludeFilter = constructPackageFilters(config.excludePackages || [], 'some')
    const depsFilter = constructPackageFilters(config.excludeDependenciesOf || [], 'some')
    console.log(c.cyan`${MARK_NODE} Reading node_modules...`)
    const result = await listPackageDependencies({
      cwd: process.cwd(),
      depth: 8,
      monorepo: true,
      ...options,
      traverseFilter(node) {
        return !excludeFilter(node)
      },
      dependenciesFilter(node) {
        return !depsFilter(node)
      },
    })

    const hash = getHash([...result.packages.keys()].sort())

    const buildTasks: (Promise<void>)[] = []

    // For build mode, we run publint upfront
    if (options.mode === 'build' && config.publint) {
      buildTasks.push((async () => {
        console.log(c.cyan`${MARK_NODE} Running publint...`)
        const limit = pLimit(20)
        await Promise.all([...result.packages.values()]
          .map(pkg => limit(async () => {
            pkg.resolved.publint ||= await getPublint(pkg, false)
          })))
        console.log(c.green`${MARK_CHECK} Publint finished`)
      })())
    }

    // For build mode, we fetch the npm meta upfront
    if (options.mode === 'build' && config.fetchNpmMeta) {
      buildTasks.push((async () => {
        console.log(c.cyan`${MARK_NODE} Fetching npm meta...`)
        try {
          await Promise.allSettled([
            getPackagesNpmMeta(Array.from(result.packages.keys()), false),
            getPackagesNpmMetaLatest(Array.from(new Set(Array.from(result.packages.values()).map(x => x.name))), false),
          ])
        }
        catch (e) {
          console.error(c.red`${MARK_NODE} Failed to fetch npm meta`)
          console.error(e)
        }
        console.log(c.green`${MARK_CHECK} npm meta fetched`)
      })())
    }

    await Promise.all(buildTasks)

    // Fullfill the npm meta
    await Promise.all(Array.from(result.packages.values())
      .map(async (pkg) => {
        const meta = await options.storageNpmMeta.getItem(pkg.spec)
        if (meta)
          pkg.resolved.npmMeta = meta

        const metaLatest = await options.storageNpmMetaLatest.getItem(pkg.name)
        if (metaLatest && isNpmMetaLatestValid(metaLatest))
          pkg.resolved.npmMetaLatest = metaLatest
      }))

    console.log(c.green`${MARK_CHECK} node_modules read finished`)

    return {
      hash,
      timestamp: Date.now(),
      ...result,
      config,
    }
  }

  return {
    getPayload,
    getPackagesNpmMeta,
    getPackagesNpmMetaLatest,
    getPublint,
    async openInEditor(filename: string) {
      await import('launch-editor').then(r => (r.default || r)(filename))
    },
    async openInFinder(filename: string) {
      await import('open').then(r => r.default(filename))
    },
  }
}
