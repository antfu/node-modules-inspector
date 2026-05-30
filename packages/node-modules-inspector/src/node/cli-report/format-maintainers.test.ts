import type { MaintainersGroupDto } from '../../shared/reports/dto'
import { describe, expect, it } from 'vitest'
import { formatMaintainers } from './format-maintainers'
import { stripAnsi } from './format-util'

describe('formatMaintainers', () => {
  it('renders empty state', () => {
    expect(stripAnsi(formatMaintainers([]))).toMatchInlineSnapshot(`
      "No maintainer actions found.
      "
    `)
  })

  it('renders dep-upgrade + publint groups', () => {
    const groups: MaintainersGroupDto[] = [
      {
        consumer: { spec: 'rollup-plugin-esbuild@6.2.1', name: 'rollup-plugin-esbuild', version: '6.2.1', depth: 1 },
        authors: [{ type: 'github', github: 'egoist', avatar: 'https://avatars.githubusercontent.com/egoist' }],
        items: [
          {
            kind: 'publint',
            messages: [],
            counts: { error: 0, warning: 1, suggestion: 2 },
          },
          {
            kind: 'dep-upgrade',
            depName: 'unplugin-utils',
            depType: 'prod',
            declaredRange: '^0.2.4',
            installedHighestVersion: '0.3.1',
            installedHighestSpec: 'unplugin-utils@0.3.1',
            installedVersions: ['0.2.4', '0.3.1'],
            migratedCount: 10,
            totalCount: 11,
            migrationRatio: 10 / 11,
          },
        ],
        maxMigrationRatio: 10 / 11,
        latestReleasedAt: 0,
      },
      {
        consumer: { spec: 'eslint@10.4.0', name: 'eslint', version: '10.4.0', depth: 1 },
        authors: [{ type: 'github', github: 'eslint', avatar: 'https://avatars.githubusercontent.com/eslint' }],
        items: [
          {
            kind: 'dep-upgrade',
            depName: 'ajv',
            depType: 'prod',
            declaredRange: '^6.14.0',
            catalogName: 'deps',
            rawRange: 'catalog:deps',
            installedHighestVersion: '8.17.1',
            installedHighestSpec: 'ajv@8.17.1',
            installedVersions: ['6.14.0', '8.17.1'],
            migratedCount: 3,
            totalCount: 5,
            migrationRatio: 3 / 5,
          },
        ],
        maxMigrationRatio: 3 / 5,
        latestReleasedAt: 0,
      },
    ]
    expect(stripAnsi(formatMaintainers(groups))).toMatchInlineSnapshot(`
      "rollup-plugin-esbuild v6.2.1 · depth 1
        by @egoist
        publint  1 warning, 2 suggestions
        prod  unplugin-utils ^0.2.4 → v0.3.1  migration 10/11 (91%)

      eslint v10.4.0 · depth 1
        by @eslint
        prod  ajv ^6.14.0 → v8.17.1 catalog:deps  migration 3/5 (60%)

      2 consumers with actions
      "
    `)
  })
})
