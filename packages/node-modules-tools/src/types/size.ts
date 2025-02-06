export interface PackageInstallSizeInfo {
  bytes: number
  categories: Partial<Record<FileCategory, { bytes: number, count: number }>>
}

export type FileCategory =
  | 'comp'
  | 'css'
  | 'doc'
  | 'dts'
  | 'html'
  | 'image'
  | 'js'
  | 'json'
  | 'other'
  | 'test'
  | 'ts'
  | 'bin'
  | 'map'
  | 'wasm'
  | 'flow'
  | 'font'
