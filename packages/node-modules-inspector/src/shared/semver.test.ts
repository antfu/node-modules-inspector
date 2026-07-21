import { describe, expect, it, vi } from 'vitest'
import { compareSemver } from './semver'

describe('compareSemver', () => {
  it('compares stable and prerelease versions', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBe(-1)
    expect(compareSemver('1.0.0', '1.0.0-beta.1')).toBe(1)
    expect(compareSemver('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1)
  })

  it('falls back for invalid versions', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(compareSemver('invalid', '1.0.0')).toBe(0)
    expect(error).toHaveBeenCalledOnce()
    error.mockRestore()
  })
})
