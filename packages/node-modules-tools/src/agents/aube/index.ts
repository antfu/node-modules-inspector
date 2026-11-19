import { createListPackageDependencies } from '../pnpm-compat'

export const listPackageDependencies = createListPackageDependencies({
  packageManager: 'aube',
  binary: 'aube',
  virtualStoreDirs: ['.aube'],
  workspaceManifests: ['aube-workspace.yaml', 'pnpm-workspace.yaml'],
})
