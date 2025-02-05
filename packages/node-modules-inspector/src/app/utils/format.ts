export function bytesToHumanSize(bytes: number, digits = 2) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  if (i === 0)
    return ['<1', 'K']
  return [(+(bytes / 1024 ** i).toFixed(digits)).toLocaleString(), sizes[i]]
}
