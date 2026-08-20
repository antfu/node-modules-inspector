import { describe, expect, it } from 'vitest'
import { compareSemverRange, parseSemverRange } from './semver'

describe('parseSemverRange', () => {
  it('parses unions and partial versions', () => {
    expect(parseSemverRange('^20.19 || ^22.12 || >=24')).toEqual({
      valid: true,
      raw: '^20.19 || ^22.12 || >=24',
      highest: '24.0.0',
      lowest: '20.19.0',
      parts: ['^20.19', '^22.12', '>=24'],
      bare: ['20.19.0', '22.12.0', '24.0.0'],
    })
  })

  it('supports compound (space-separated AND) ranges without crashing', () => {
    // Regression: `14 >=14.17.0` used to be whitespace-collapsed into the
    // invalid version `14>=14.17.0` and thrown at in `compareSemver`.
    const parsed = parseSemverRange('14 >=14.17.0')
    expect(parsed.valid).toBe(true)
    expect(parsed.lowest).toBe('14.17.0')
    expect(parsed.highest).toBe('14.17.0')
  })

  it('handles hyphen and mixed-operator ranges', () => {
    expect(parseSemverRange('>=16.0.0 <21').valid).toBe(true)
    expect(parseSemverRange('12 - 14')).toMatchObject({ valid: true, lowest: '12.0.0' })
  })

  it('preserves prerelease versions', () => {
    expect(parseSemverRange('^1.0.0-beta.1')).toMatchObject({
      valid: true,
      highest: '1.0.0-beta.1',
      lowest: '1.0.0-beta.1',
    })
  })

  it('rejects invalid ranges', () => {
    expect(parseSemverRange('not a range')).toEqual({
      valid: false,
      raw: 'not a range',
    })
  })
})

describe('compareSemverRange', () => {
  it('orders ranges by their lowest version', () => {
    expect(compareSemverRange('^1.0.0', '^2.0.0')).toBe(1)
    expect(compareSemverRange('^2.0.0', '^1.0.0')).toBe(-1)
  })
})
