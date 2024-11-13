import { asObject, asString } from 'cleaners'

import { FiatPluginRegionCode } from '../fiatPluginTypes'
import { FiatProviderError, FiatProviderExactRegions, FiatProviderSupportedRegions } from '../fiatProviderTypes'

export const RETURN_URL_SUCCESS = 'https://edge.app/redirect/success/'
export const RETURN_URL_FAIL = 'https://edge.app/redirect/fail/'
export const RETURN_URL_CANCEL = 'https://edge.app/redirect/cancel/'
export const RETURN_URL_PAYMENT = 'https://edge.app/redirect/payment/'

export const NOT_SUCCESS_TOAST_HIDE_MS = 5000

/**
 * @param providerId Unique providerId to filter.
 * @param regionCode FiatPluginRegionCode object with country & state/province
 * @param supportedRegions FiatProviderSupportedRegions object
 * @returns void if supported, throws otherwise
 */
export const validateRegion = (providerId: string, regionCode: FiatPluginRegionCode, supportedRegions: FiatProviderSupportedRegions): void => {
  const { countryCode, stateProvinceCode } = regionCode
  const countryInfo = supportedRegions[countryCode]
  if (countryInfo == null) return

  const { forStateProvinces, notStateProvinces } = countryInfo

  if (stateProvinceCode != null) {
    if (notStateProvinces?.includes(stateProvinceCode) === true) {
      throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
    }
    if (forStateProvinces?.includes(stateProvinceCode) === false) {
      throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
    }
  }
}

/**
 * Validates if the provided region code is supported by the given provider.
 *
 * @param providerId - The unique identifier of the provider.
 * @param regionCode - The region code to validate, containing the country and state/province codes.
 * @param supportedRegions - The object containing the supported regions for the provider.
 * @throws {FiatProviderError} - If the region is not supported, with an error type of 'regionRestricted'.
 */
export const validateExactRegion = (providerId: string, regionCode: FiatPluginRegionCode, supportedRegions: FiatProviderExactRegions): void => {
  const { countryCode, stateProvinceCode } = regionCode
  const countryInfo = supportedRegions[countryCode]
  if (countryInfo == null || countryInfo === false) {
    throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
  }

  if (countryInfo === true) {
    return
  }

  const { forStateProvinces, notStateProvinces } = countryInfo

  if (stateProvinceCode != null) {
    if (notStateProvinces?.includes(stateProvinceCode) === true) {
      throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
    }
    if (forStateProvinces?.includes(stateProvinceCode) === false) {
      throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
    }
  }
}

/**
 * Adds an exact region to the list of allowed country codes for a Fiat provider.
 *
 * @param allowedCountryCodes - The object containing the allowed country codes and state/province codes.
 * @param countryCode - The country code to add.
 * @param stateProvinceCode - The optional state/province code to add.
 * @returns void
 */
export const addExactRegion = (allowedCountryCodes: FiatProviderExactRegions, countryCode: string, stateProvinceCode?: string): void => {
  if (stateProvinceCode == null) {
    allowedCountryCodes[countryCode] = true
  } else {
    const oldCountry = allowedCountryCodes[countryCode]
    let newCountry: FiatProviderExactRegions['cc'] = {}
    if (typeof oldCountry === 'object') newCountry = { ...oldCountry }
    if (newCountry.forStateProvinces == null) {
      newCountry.forStateProvinces = [stateProvinceCode]
    } else {
      if (!newCountry.forStateProvinces.includes(stateProvinceCode)) {
        newCountry.forStateProvinces.push(stateProvinceCode)
      }
    }
    allowedCountryCodes[countryCode] = newCountry
  }
}

export const asStandardApiKeys = asObject({
  apiKey: asString
})

const DAILY_INTERVAL_MS = 1000 * 60 * 60 * 24 // 1 day
/**
 * Checks if a daily check is due based on the last check time.
 *
 * @param lastCheck - The timestamp of the last check, in milliseconds since the Unix epoch.
 * @returns `true` if the daily check interval has elapsed since the last check, `false` otherwise.
 */
export const isDailyCheckDue = (lastCheck: number): boolean => {
  const now = Date.now()
  const last = new Date(lastCheck).getTime()
  return now - last > DAILY_INTERVAL_MS
}

/**
 * Checks if a interval has passed based on the last check time. If the check
 * is due, the last check time is updated to the current time.
 *
 * @param interval the interval in milliseconds
 * @returns a "check-due" function which will return `true` if the check interval
 * has elapsed since the last check, `false` otherwise. Also allows for an override
 * to reset the last check time.
 */
export const makeCheckDue = (interval: number) => {
  let last: number = 0
  /**
   * Checks if a interval has passed based on the last check time. If the check
   * is due, the last check time is updated to the current time.
   * Also allows for an override to reset the last check time.
   */
  return function checkDue(override?: boolean): boolean {
    if (override != null) {
      last = override ? last : 0
      return override
    }
    const now = Date.now()
    if (now - last > interval) {
      last = now
      return true
    }
    return false
  }
}
