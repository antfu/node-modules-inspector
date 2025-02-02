import type { ListPackageDependenciesResult } from 'node-modules-tools'

export interface ServerFunctions {
  listDependencies: () => Promise<ListPackageDependenciesResult>
  openInEditor: (filename: string) => void
  openInFinder: (filename: string) => void
}

export interface ClientFunctions {}

export type ServerFunctionsDump = {
  [K in keyof ServerFunctions]: Awaited<ReturnType<ServerFunctions[K]>>
}

export interface Metadata {
  cwd: string
  websocket: number
}
