import type { ListPackageDependenciesResult } from 'node-modules-tools'

export interface ServerFunctions {
  listDependencies: () => Promise<ListPackageDependenciesResult>
  getPackagesPublishDate: (deps: string[]) => Promise<Map<string, string>>
  openInEditor: (filename: string) => void
  openInFinder: (filename: string) => void
}

export type RemoveVoidKeysFromObject<T> = { [K in keyof T]: T[K] extends void ? never : K } extends { [_ in keyof T]: never } ? T : { [K in keyof T as T[K] extends void ? never : K]: T[K] }

export interface ClientFunctions {}

export type ServerFunctionsDump = RemoveVoidKeysFromObject<{
  [K in keyof ServerFunctions]: Awaited<ReturnType<ServerFunctions[K]>>
}>

export interface ConnectionMeta {
  websocket: number
}
