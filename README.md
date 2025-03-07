![](./packages/node-modules-inspector/src/app/public/favicon.svg)

# Node Modules Inspector

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Interactive UI for local node modules inspection.

### Quick Start

Try it by running following command under your `pnpm`/`npm` project.

```bash
pnpx node-modules-inspector
```
```bash
npx node-modules-inspector
```

> Currently only support `pnpm` and `npm` projects. We are counting on the community to bring support for other package managers.

### Online Version

You can also try an online version at [**node-modules.dev**](https://node-modules.dev/), powered by [WebContainer](https://webcontainers.io/).

## Configuration

You can create a `node-modules-inspector.config.ts` file in your project root to configure the inspector's default behaviour.

```js
import { defineConfig } from 'node-modules-inspector'

export default defineConfig({
  defaultFilters: {
    excludes: [
      'eslint',
    ],
  },
  defaultSettings: {
    moduleTypeSimple: true,
  }
})
```

## Static Build

You can also build a static SPA of your current node_modules status:

```bash
pnpx node-modules-inspector build
```
```bash
npx node-modules-inspector build
```

Then you can host the `.node-modules-inspector` folder with any static file server.

You can see a build for all Anthony Fu's packages at [everything.antfu.dev](https://everything.antfu.dev).

## Screenshots

![Image](https://github.com/user-attachments/assets/80ce6f9d-26fb-4fcf-8c51-e3d2b6f9f24c)
![Image](https://github.com/user-attachments/assets/6de8614c-2663-4c69-bd1e-96e8e66673a7)
![Image](https://github.com/user-attachments/assets/b3efa459-6a6a-41c4-a9cd-5afac9268bf8)

## Credits

- This project is heavily inspired by [npmgraph](https://npmgraph.js.org/)
- Thanks to [@wooorm](https://github.com/wooorm) for the module type detection algorithm in [wooorm/npm-esm-vs-cjs](https://github.com/wooorm/npm-esm-vs-cjs)
- The logo is derivated from the `black-hole-line-duotone` icon (yeah it's a black hole!) from the [Solar Icon Sets](https://www.figma.com/community/file/1166831539721848736/solar-icons-set) by [480 Design](https://www.figma.com/@480design) and [R4IN80W](https://www.figma.com/@voidrainbow) under the [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) license.
- Thanks to [@privatenumber](https://github.com/privatenumber) for [pkg-size.dev](https://pkg-size.dev/) for running analysis with installations in WebContainer.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/node-modules-inspector?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/node-modules-inspector
[npm-downloads-src]: https://img.shields.io/npm/dm/node-modules-inspector?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/node-modules-inspector
[bundle-src]: https://img.shields.io/bundlephobia/minzip/node-modules-inspector?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=node-modules-inspector
[license-src]: https://img.shields.io/github/license/antfu/node-modules-inspector.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/node-modules-inspector/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/node-modules-inspector
