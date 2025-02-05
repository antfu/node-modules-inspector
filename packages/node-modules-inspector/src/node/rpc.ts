import type { ServerFunctions } from '#shared/types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesResult } from 'node-modules-tools'
import type { Storage } from 'unstorage'
import process from 'node:process'
import { listPackageDependencies } from 'node-modules-tools'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

async function getPackagePublishDate(pkg: PackageNode, options: { storage: Storage }) {
  const storage = options.storage
  if (await storage.hasItem(pkg.name)) {
    return storage.getItem(pkg.name)
  }
  const date = await fetch(`https://npm.antfu.dev/${pkg.name}`).then(r => r.json()).then(r => r.publishedAt)
  await storage.setItem(pkg.name, date)
  return date
}

export interface ListPackagePublishDatesOptions {
  storage: Storage
}

export async function listPackagePublishDates(packages: ListPackageDependenciesResult['packages'], options: ListPackagePublishDatesOptions) {
  const {
    storage = createStorage({ driver: fsDriver({ base: './tmp' }) }),
  } = options
  const entries = Array.from(packages.entries())

  const promises = entries.map(async ([key, value]) => {
    const newValue = await getPackagePublishDate(value, { storage })
    return [key, newValue]
  })

  const resolvedEntries = await Promise.all(promises)

  return new Map(resolvedEntries)
}

export interface CreateServerFunctionsOptions extends Partial<ListPackageDependenciesOptions>, ListPackagePublishDatesOptions {
}

export function createServerFunctions(options: CreateServerFunctionsOptions): ServerFunctions {
  const deps = listPackageDependencies({
    cwd: process.cwd(),
    depth: 25,
    monorepo: true,
    ...options,
  })
  return {
    async listDependencies() {
      return deps
    },
    async dependenciesPublishDate() {
      return listPackagePublishDates((await deps).packages, { storage: options.storage })
    },
    async openInEditor(filename: string) {
      // @ts-expect-error missing types
      await import('launch-editor').then(r => (r.default || r)(filename))
    },
    async openInFinder(filename: string) {
      await import('open').then(r => r.default(filename))
    },
  }
}
