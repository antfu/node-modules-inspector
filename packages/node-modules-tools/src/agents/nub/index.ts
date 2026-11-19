import { createListPackageDependencies } from '../pnpm-compat'

export const listPackageDependencies = createListPackageDependencies({
  packageManager: 'nub',
  binary: 'nub',
  virtualStoreDirs: ['.store'],
  workspaceManifests: ['pnpm-workspace.yaml', 'aube-workspace.yaml'],
})
