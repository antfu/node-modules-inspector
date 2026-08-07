import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { x } from 'tinyexec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listPackageDependenciesRaw } from '../../src/agent-entry/list'
import { resolvePackage } from '../../src/resolve'

vi.mock(import('tinyexec'), () => ({
  x: vi.fn(),
}))

const info = [
  {
    value: 'yarn-test@workspace:.',
    children: {
      Version: '1.0.0',
      Dependencies: [
        { descriptor: 'debug@npm:4.4.0', locator: 'debug@npm:4.4.0' },
        { descriptor: 'tinyexec@npm:0.3.2', locator: 'tinyexec@npm:0.3.2' },
      ],
    },
  },
  {
    value: 'debug@npm:4.4.0',
    children: {
      Version: '4.4.0',
      Dependencies: [
        { descriptor: 'ms@npm:^2.1.3', locator: 'ms@npm:2.1.3' },
      ],
    },
  },
  { value: 'ms@npm:2.1.3', children: { Version: '2.1.3' } },
  { value: 'tinyexec@npm:0.3.2', children: { Version: '0.3.2' } },
]

const options = {
  cwd: '',
  depth: 25,
  monorepo: true,
}

let root: string | undefined

async function writePackage(filepath: string, manifest: Record<string, unknown>) {
  await fs.mkdir(filepath, { recursive: true })
  await fs.writeFile(join(filepath, 'package.json'), JSON.stringify(manifest), 'utf8')
  await fs.writeFile(join(filepath, 'index.js'), 'export default true\n', 'utf8')
}

beforeEach(async () => {
  vi.mocked(x).mockReset()
  root = await fs.mkdtemp(join(tmpdir(), 'node-modules-tools-yarn-'))
  options.cwd = root

  await Promise.all([
    writePackage(root, {
      name: 'yarn-test',
      version: '1.0.0',
      private: true,
      dependencies: { debug: '4.4.0' },
      devDependencies: { tinyexec: '0.3.2' },
    }),
    writePackage(join(root, 'node_modules/debug'), { name: 'debug', version: '4.4.0', license: 'MIT' }),
    writePackage(join(root, 'node_modules/ms'), { name: 'ms', version: '2.1.3' }),
    writePackage(join(root, 'node_modules/tinyexec'), { name: 'tinyexec', version: '0.3.2' }),
  ])

  await fs.writeFile(join(root, 'node_modules/.yarn-state.yml'), [
    '__metadata:',
    '  version: 1',
    '  nmMode: classic',
    '',
    '"yarn-test@workspace:.":',
    '  locations:',
    '    - ""',
    '',
    '"debug@virtual:peer-hash#npm:4.4.0":',
    '  locations:',
    '    - "node_modules/debug"',
    '',
    '"ms@npm:2.1.3":',
    '  locations:',
    '    - "node_modules/ms"',
    '',
    '"tinyexec@npm:0.3.2":',
    '  locations:',
    '    - "node_modules/tinyexec"',
    '',
  ].join('\n'), 'utf8')
})

afterEach(async () => {
  if (root)
    await fs.rm(root, { recursive: true, force: true })
  root = undefined
})

describe('listYarnPackageDependencies', () => {
  it('maps Yarn locators to installed packages and their sizes', async () => {
    vi.mocked(x).mockImplementation((_command, args = []) => {
      const command = args.join(' ')
      const stdout = command === 'config get nodeLinker'
        ? 'node-modules\n'
        : command === '--version'
          ? '4.7.0\n'
          : `${info.map(item => JSON.stringify(item)).join('\n')}\n`
      return Promise.resolve({ stdout, stderr: '', exitCode: 0 }) as unknown as ReturnType<typeof x>
    })

    const result = await listPackageDependenciesRaw('yarn@berry', options)

    expect(result.packageManager).toBe('yarn')
    expect(result.packageManagerVersion).toBe('4.7.0')

    const workspace = result.packages.get('yarn-test@1.0.0')
    expect(workspace?.workspace).toBe(true)
    expect(workspace?.private).toBe(true)
    expect(workspace?.dependencies).toEqual(new Set(['debug@4.4.0', 'tinyexec@0.3.2']))

    const debug = result.packages.get('debug@4.4.0')
    expect(debug?.filepath).toBe(join(root!, 'node_modules/debug'))
    expect(debug?.clusters).toContain('dep:prod')
    expect(debug?.dependencies).toContain('ms@2.1.3')

    const tinyexec = result.packages.get('tinyexec@0.3.2')
    expect(tinyexec?.clusters).toContain('dep:dev')

    const resolved = await resolvePackage('yarn@berry', debug!, options)
    expect(resolved.resolved.license).toBe('MIT')
    expect(resolved.resolved.installSize?.bytes).toBeGreaterThan(0)

    expect(x).toHaveBeenCalledWith(
      'yarn',
      ['config', 'get', 'nodeLinker'],
      expect.objectContaining({ throwOnError: true }),
    )
  })

  it('rejects Plug\'n\'Play with an actionable message', async () => {
    vi.mocked(x).mockResolvedValue({ stdout: 'pnp\n', stderr: '', exitCode: 0 })

    await expect(listPackageDependenciesRaw('yarn@berry', options)).rejects.toThrow(
      'set `nodeLinker: node-modules` in .yarnrc.yml and run `yarn install`',
    )
  })
})
