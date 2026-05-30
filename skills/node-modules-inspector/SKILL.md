---
name: node-modules-inspector
description: >
  Inspects a project's installed node_modules and produces three reports:
  duplicated packages (installed in multiple versions), packages sorted by
  install size, and maintenance actions (dep-upgrade opportunities + publint
  findings, grouped by consumer/author). Use when the user wants to audit
  dependencies, find duplicate packages, check what's taking up disk space in
  node_modules, identify outdated peer/prod dependencies that newer dependents
  could upgrade past, or list publint problems. Available as a CLI
  (`npx node-modules-inspector report <duplicates|sizes|maintainers> [--json]`)
  or an MCP stdio server (`npx node-modules-inspector mcp`) exposing the same
  three reports as agent tools. Works with pnpm, npm, and bun.
---

# node-modules-inspector

`node-modules-inspector` is a CLI + MCP server that inspects the installed `node_modules` of the current project and produces structured reports. Three reports, same underlying analysis pipeline:

| Report | Answers |
|---|---|
| `duplicates` | Which packages are installed in multiple versions? |
| `sizes` | Which packages take up the most disk space? |
| `maintainers` | Which consumers have dep-upgrade opportunities or publint issues, grouped by package and author? |

Reports run against the real on-disk `node_modules` — no registry calls are required for the basic shape; npm metadata is fetched only to enrich the maintainers report (gated by config).

Works with pnpm, npm, and bun. The default `npx node-modules-inspector` (with no subcommand) opens a Vue web UI for humans; agents should use the `report` and `mcp` subcommands below.

## When to reach for this

Trigger on any of:
- "audit my dependencies", "find duplicate packages", "node_modules cleanup"
- "what's taking up disk space in node_modules"
- "which deps are outdated" / "what dep-upgrade opportunities are there"
- "show me publint issues across my deps"
- "who maintains my dependencies"

Don't reach for it for: registry-only questions (use `fast-npm-meta`), bundle-size analysis of a single package (use a bundler-specific tool), security audits (use `npm audit` / `osv-scanner`).

## CLI mode

All subcommands share these options:
- `--root <dir>` — project root (default: cwd)
- `--config <file>` — config file (default: `node-modules-inspector.config.{ts,js,json}`)
- `--depth <n>` — max dependency depth to traverse (default: `8`)
- `--json` — emit JSON to stdout; pretty ANSI table otherwise

Progress logs always go to stderr, so `... --json` is pipe-safe.

### duplicates

```sh
npx node-modules-inspector report duplicates --json
```

Options:
- `--min-versions <n>` — only include packages installed at this many versions or more (default: `2`)
- `--limit <n>` — cap result count

Output shape:
```json
[
  {
    "name": "@typescript-eslint/scope-manager",
    "versions": ["8.56.1", "8.59.1", "8.59.2", "8.59.4"],
    "specs": ["@typescript-eslint/scope-manager@8.56.1", "..."]
  }
]
```

Versions are sorted ascending by semver. Entries are sorted by version-count descending. Use this to find dedupe targets — `pnpm dedupe` / `npm dedupe` resolves these where ranges overlap.

### sizes

```sh
npx node-modules-inspector report sizes --json --limit 20
```

Options:
- `--limit <n>` — cap result count (default: `50`)
- `--include-workspace` — include workspace packages (default: excluded; they have no meaningful install size)

Output shape:
```json
[
  {
    "spec": "typescript@6.0.3",
    "name": "typescript",
    "version": "6.0.3",
    "workspace": false,
    "bytes": 24346827,
    "categories": {
      "js": { "bytes": 15344521, "count": 200 },
      "dts": { "bytes": 7002306, "count": 150 }
    }
  }
]
```

`categories` keys come from a fixed set: `js`, `ts`, `dts`, `json`, `bin`, `wasm`, `map`, `image`, `css`, `html`, `comp`, `doc`, `test`, `flow`, `other`. Entries are sorted by `bytes` descending.

### maintainers

```sh
npx node-modules-inspector report maintainers --json
```

Options:
- `--sort <depth|migration|latest>` — sort by consumer depth, max migration ratio, or latest release time (default: `depth`)
- `--author <handle>` — filter to consumers maintained by this author; repeatable
- `--no-publint` — exclude publint findings
- `--no-latest-only` — include consumer packages that are not on their latest major
- `--limit <n>` — cap result count

Output shape:
```json
[
  {
    "consumer": { "spec": "rollup-plugin-esbuild@6.2.1", "name": "rollup-plugin-esbuild", "version": "6.2.1", "depth": 1 },
    "authors": [{ "type": "github", "github": "egoist", "avatar": "..." }],
    "items": [
      {
        "kind": "dep-upgrade",
        "depName": "unplugin-utils",
        "depType": "prod",
        "declaredRange": "^0.2.4",
        "rawRange": "catalog:deps",
        "catalogName": "deps",
        "installedHighestVersion": "0.3.1",
        "installedHighestSpec": "unplugin-utils@0.3.1",
        "installedVersions": ["0.2.4", "0.3.1"],
        "migratedCount": 10,
        "totalCount": 11,
        "migrationRatio": 0.909
      },
      {
        "kind": "publint",
        "messages": [/* publint Message objects */],
        "counts": { "error": 0, "warning": 1, "suggestion": 2 }
      }
    ],
    "maxMigrationRatio": 0.909,
    "latestReleasedAt": 1739000000000
  }
]
```

How to read this:
- A `dep-upgrade` item means: this consumer declares `depName` at `declaredRange`, but there's a newer installed version (`installedHighestVersion`) that the range does not satisfy. `migrationRatio` is the fraction of consumers in the same cohort that already migrated — a high ratio (e.g. 0.9) means most other consumers already moved on, so this one is lagging.
- `rawRange` differs from `declaredRange` only when the consumer used a pnpm catalog reference (`catalog:deps`); `declaredRange` is the resolved range.
- A `publint` item carries the raw publint messages, partitioned by severity in `counts`.
- `authors` come from the consumer's `package.json` author/maintainers fields, with GitHub-handle detection.

Publint findings only appear when `pkg.resolved.publint` was populated. Enable that by adding `publint: true` to `node-modules-inspector.config.ts` (or by using the project's web UI which runs publint async).

## MCP mode

```sh
npx node-modules-inspector mcp
```

Starts an MCP stdio server. Exposes three tools, identical surface to the CLI:

- `nmi:report-duplicates`
- `nmi:report-sizes`
- `nmi:report-maintainers`

When configured in an MCP client (e.g. Claude Code) under server name `node-modules-inspector`, address them as `node-modules-inspector:nmi:report-duplicates`, etc.

Tool input schemas mirror the CLI options. Tool output is JSON in the exact shape shown above for each report.

Prefer MCP when:
- Multiple queries are expected in one session — the dependency tree is read once and cached across tool calls.
- The agent needs structured output schemas to drive validation.

Prefer the CLI (`report ... --json`) when shell-pipelining (`jq`, redirect, etc.) is more convenient.

## Flags the agent should know

- The first run reads `node_modules` end-to-end and caches npm metadata on disk (under `~/.node-modules-inspector` or similar). Subsequent runs are much faster.
- Workspace packages are excluded from `sizes` by default — pass `--include-workspace` if you actually want them.
- `--depth 8` is enough for almost all real projects. Increase only if the user explicitly asks about deeply-nested transitive dependencies.
- For very large monorepos, running against a single workspace package via `--root packages/<name>` is faster than the whole repo.

## Failure modes

- "No package manager detected" — the project has no `node_modules` directory, or none of pnpm/npm/bun lockfiles. Suggest the user run install first.
- Empty `duplicates` result — fine, it means everything is deduped (mention `pnpm dedupe` etc. only if user wants to verify).
- Empty `maintainers` result — usually means there are no dep-upgrade opportunities AND `publint: true` is not set in the config; if the user expected publint output, point them at the config.

## Web UI (skip for agent tasks)

`npx node-modules-inspector` (no subcommand) starts a Vue dev server on port `9999` with a full visual explorer (graph view, filters, multi-version compare, maintainer-action dashboard). It's for humans; don't suggest it for an agent task. The `report` CLI and `mcp` server above cover the same data programmatically.

`npx node-modules-inspector build` produces a static SPA of the analysis into `dist/__node-modules-inspector/` — useful for CI artifacts but not for agent consumption.
