// Regenerates the Storybook Overview page (src/app/components/Overview.mdx)
// from the stories on disk: one linked `### [Name](…)` title + a <Canvas> per
// variation, grouped by the category in each story's `title`.
// Run from the package root: `node scripts/gen-overview.mjs` (pnpm docs:overview)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const base = 'src/app/components'

const files = []
for (const dir of readdirSync(base, { withFileTypes: true })) {
  if (!dir.isDirectory())
    continue
  for (const f of readdirSync(join(base, dir.name)).filter(f => f.endsWith('.stories.ts')).sort()) {
    const name = f.replace('.stories.ts', '')
    const src = readFileSync(join(base, dir.name, f), 'utf8')
    const title = src.match(/title:\s*'([^']+)'/)?.[1] ?? `${dir.name}/${name}`
    const category = title.split('/')[0]
    const exps = [...src.matchAll(/export const (\w+)/g)].map(m => m[1])
    files.push({
      dir: dir.name,
      name,
      category,
      exps,
      id: `${title.toLowerCase().replaceAll('/', '-')}--docs`,
    })
  }
}
files.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

let out = `import { Canvas, Meta } from '@storybook/addon-docs/blocks'\n`
for (const f of files) out += `import * as ${f.category}${f.name} from './${f.dir}/${f.name}.stories'\n`
out += `
<Meta title="Overview" />

# Node Modules Inspector — Components

App-specific presentational building blocks, themed end-to-end by the
[\`@antfu/design\`](https://github.com/antfu/design) UnoCSS preset. Generic
primitives (badges, versions, avatars, checkboxes, drawers) come from
\`@antfu/design\` directly and are documented in that package's own Storybook —
only components unique to this app live here. Toggle the theme from the
toolbar to check both light and dark. Each tile is a live story; click a
component name to open its full page.
`
let cur = ''
for (const f of files) {
  if (f.category !== cur) {
    out += `\n## ${f.category}\n`
    cur = f.category
  }
  out += `\n### [${f.name}](/?path=/docs/${f.id})\n\n${f.exps.map(e => `<Canvas of={${f.category}${f.name}.${e}} />`).join('\n')}\n`
}
writeFileSync(join(base, 'Overview.mdx'), out)
console.log(`Overview.mdx: ${files.length} components`)
