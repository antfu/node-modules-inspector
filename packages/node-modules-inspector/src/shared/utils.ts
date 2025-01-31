export function compareSemver(a: string, b: string): number {
  const digitsA = a.split('.').map(Number)
  const digitsB = b.split('.').map(Number)
  for (let i = 0; i < Math.min(digitsA.length, digitsB.length); i++) {
    if (digitsA[i] !== digitsB[i]) {
      return digitsA[i] - digitsB[i]
    }
  }
  return a.localeCompare(b)
}
