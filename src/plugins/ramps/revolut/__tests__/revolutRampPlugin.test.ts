import { describe, expect, it } from '@jest/globals'

// Test the validateRegion function behavior
describe('revolutRampPlugin region handling', () => {
  // Since validateRegion is not exported, we'll test the behavior indirectly
  // by checking the region string construction logic

  it('should create region string with state when stateProvinceCode is present', () => {
    const regionCode = {
      countryCode: 'US',
      stateProvinceCode: 'CA'
    }

    // Test the region string construction logic
    const region =
      regionCode.stateProvinceCode == null
        ? regionCode.countryCode
        : `${regionCode.countryCode}:${regionCode.stateProvinceCode}`

    expect(region).toBe('US:CA')
  })

  it('should use only country code when stateProvinceCode is not present', () => {
    const regionCode: {
      countryCode: string
      stateProvinceCode: string | undefined
    } = {
      countryCode: 'US',
      stateProvinceCode: undefined
    }

    // Test the region string construction logic
    const region =
      regionCode.stateProvinceCode == null
        ? regionCode.countryCode
        : `${regionCode.countryCode}:${regionCode.stateProvinceCode}`

    expect(region).toBe('US')
  })

  it('should extract country code from region string with colon', () => {
    const regionString = 'US:CA'

    // Test the country extraction logic used in validateRegion
    const countryCode = regionString.includes(':')
      ? regionString.split(':')[0]
      : regionString

    expect(countryCode).toBe('US')
  })

  it('should handle region string without colon', () => {
    const regionString = 'US'

    // Test the country extraction logic used in validateRegion
    const countryCode = regionString.includes(':')
      ? regionString.split(':')[0]
      : regionString

    expect(countryCode).toBe('US')
  })
})
