import type { Message as PublintMessage } from 'publint'
import type { NpmMeta, NpmMetaLatest } from '../shared/types'
import process from 'node:process'
import { join } from 'pathe'
import { createStorage } from 'unstorage'
import driverFs from 'unstorage/drivers/fs-lite'

export const storageNpmMeta = createStorage<NpmMeta>({
  driver: driverFs({
    base: join(process.cwd(), 'node_modules/.cache/node-modules-inspector/npm-meta'),
  }),
})

export const storageNpmMetaLatest = createStorage<NpmMetaLatest>({
  driver: driverFs({
    base: join(process.cwd(), 'node_modules/.cache/node-modules-inspector/npm-meta-latest'),
  }),
})

export const storagePublint = createStorage<PublintMessage[]>({
  driver: driverFs({
    base: join(process.cwd(), 'node_modules/.cache/node-modules-inspector/publint'),
  }),
})
