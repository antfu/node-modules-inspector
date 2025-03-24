import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { addTemplate, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'webcontainer-setup',
  },
  setup() {
    addTemplate({
      filename: 'webcontainer-server-code',
      getContents: async ({ nuxt }) => {
        try {
          const content = await fs.readFile(fileURLToPath(new URL('../../../runtime/webcontainer-server.mjs', import.meta.url)), 'utf-8')
          return `export const WEBCONTAINER_SERVER_CODE = ${JSON.stringify(content)}`
        }
        catch (e) {
          if (nuxt.options._prepare) {
            return `export const WEBCONTAINER_SERVER_CODE = ''`
          }
          throw e
        }
      },
    })
  },
})
