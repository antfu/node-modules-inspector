import type { PackageJson } from 'pkg-types'
import type { PackageModuleType } from '../../src/types'

export interface PackageJsonSnapshotFixture {
  expected: PackageModuleType
  packageJson: Partial<PackageJson>
}

export const packageJsonSnapshots = {
  'type-fest@4.41.0': {
    expected: 'dts',
    packageJson: {
      name: 'type-fest',
      version: '4.41.0',
      types: './index.d.ts',
    },
  },
  'debug@4.4.3': {
    expected: 'cjs',
    packageJson: {
      name: 'debug',
      version: '4.4.3',
      main: './src/index.js',
    },
  },
  'p-limit@7.3.0': {
    expected: 'esm',
    packageJson: {
      name: 'p-limit',
      version: '7.3.0',
      type: 'module',
      exports: {
        types: './index.d.ts',
        default: './index.js',
      },
    },
  },
  'lodash@4.17.21': {
    expected: 'cjs',
    packageJson: {
      name: 'lodash',
      version: '4.17.21',
      main: 'lodash.js',
    },
  },
  'vue@3.5.27': {
    expected: 'dual',
    packageJson: {
      name: 'vue',
      version: '3.5.27',
      main: 'index.js',
      module: 'dist/vue.runtime.esm-bundler.js',
      exports: {
        '.': {
          import: {
            node: './index.mjs',
            default: './dist/vue.runtime.esm-bundler.js',
          },
          require: {
            node: {
              default: './index.js',
            },
            default: './index.js',
          },
        },
      },
    },
  },
  'rollup-plugin-esbuild@6.2.1 (#24)': {
    expected: 'dual',
    packageJson: {
      name: 'rollup-plugin-esbuild',
      version: '6.2.1',
      main: 'dist/index.js',
      module: 'dist/index.mjs',
      exports: {
        import: './dist/index.mjs',
        default: './dist/index.js',
      },
    },
  },
  '@octokit/core@7.0.5 (#128)': {
    expected: 'esm',
    packageJson: {
      name: '@octokit/core',
      version: '7.0.5',
      type: 'module',
      main: './dist-src/index.js',
      types: './dist-types/index.d.ts',
      exports: {
        '.': {
          types: './dist-types/index.d.ts',
          import: './dist-src/index.js',
        },
      },
    },
  },
  '@oxc-parser/binding-linux-x64-gnu (#124)': {
    expected: 'bin',
    packageJson: {
      name: '@oxc-parser/binding-linux-x64-gnu',
      version: '0.147.0',
      main: 'parser.linux-x64-gnu.node',
    },
  },
  '@esbuild/darwin-arm64 (#124)': {
    expected: 'bin',
    packageJson: {
      name: '@esbuild/darwin-arm64',
      version: '0.28.2',
      os: [
        'darwin',
      ],
      cpu: [
        'arm64',
      ],
    },
  },
  'anymatch@3.1.3': {
    expected: 'cjs',
    packageJson: {
      name: 'anymatch',
      version: '3.1.3',
      description: 'Matches strings against configurable strings, globs, regular expressions, and/or functions',
      files: [
        'index.js',
        'index.d.ts',
      ],
    },
  },
  'js-tokens@9.0.1': {
    expected: 'cjs',
    packageJson: {
      name: 'js-tokens',
      version: '9.0.1',
      type: 'commonjs',
      exports: './index.js',
    },
  },
  'express@5.2.1': {
    expected: 'cjs',
    packageJson: {
      name: 'express',
      version: '5.2.1',
      engines: {
        node: '>= 18',
      },
      files: [
        'LICENSE',
        'Readme.md',
        'index.js',
        'lib/',
      ],
    },
  },
  '@octokit/rest@22.0.1 (#128)': {
    expected: 'esm',
    packageJson: {
      name: '@octokit/rest',
      version: '22.0.1',
      type: 'module',
      main: './dist-src/index.js',
      module: './dist-src/index.js',
      types: './dist-types/index.d.ts',
      exports: {
        '.': {
          types: './dist-types/index.d.ts',
          import: './dist-src/index.js',
        },
      },
    },
  },
} satisfies Record<string, PackageJsonSnapshotFixture>
