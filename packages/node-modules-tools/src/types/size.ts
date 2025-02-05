export interface PackageInstallSizeInfo {
  bytes: number
  fileTypes?: Record<string, { bytes: number, count: number }>
}
