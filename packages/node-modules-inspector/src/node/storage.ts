import type { Message as PublintMessage } from 'publint'
import process from 'node:process'
import { join } from 'pathe'
import { createStorage } from 'unstorage'
import driverFs from 'unstorage/drivers/fs-lite'

export const storagePublishDates = createStorage<string>({
  driver: driverFs({
    base: join(process.cwd(), 'node_modules/.cache/node-modules-inspector/publish-dates'),
  }),
})

export const storagePublint = createStorage<PublintMessage[]>({
  driver: driverFs({
    base: join(process.cwd(), 'node_modules/.cache/node-modules-inspector/publint'),
  }),
})
