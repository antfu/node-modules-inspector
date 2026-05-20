# AGENTS.md

CLI + web UI to visualize a project's `node_modules`. Supports `pnpm`, `npm`, `bun`. Hosted version: [node-modules.dev](https://node-modules.dev).

## Layout

- `packages/node-modules-inspector/` — CLI + Nuxt SPA + devframe RPC server
- `packages/node-modules-tools/` — core lib: package-manager agents, resolution, types
- `test/e2e/` — Playwright

RPC functions live in `packages/node-modules-inspector/src/node/rpc/<name>.ts` — **one per file**, wired up in `handlers.ts`.

## Commands (from repo root)

- `pnpm dev` — dev server
- `pnpm build` — full build
- `pnpm test` / `pnpm test:e2e` — vitest / playwright
- `pnpm lint` / `pnpm typecheck`

## Conventions

- TypeScript only. Vue 3 Composition API + `<script setup lang="ts">`.
- pnpm 11 with catalogs — new deps go in `pnpm-workspace.yaml`, referenced as `catalog:<name>`.
- Lint: `@antfu/eslint-config`. Pre-commit runs `eslint --fix` via nano-staged.
- Commits: conventional, optional scope — `feat(inspector): ...`, `fix: ...`.
- `AGENTS.md` is the source of truth; `CLAUDE.md` is a symlink to it.
- E2E runs single-worker (stateful WS backend) — don't parallelize.
