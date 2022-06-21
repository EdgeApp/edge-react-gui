// @flow

import { useEffect, useState } from '../../types/reactHooks.js'
import { type Profile, useProfile } from '../useProfile.js'
import { type Promotion, useFetchPromotions } from './useFetchPromotions.js'
import { usePromoFlags } from './usePromoFlags.js'

export const useActivePromotions = () => {
  const [activePromotions, setActivePromotions] = useState([])
  const promotions = useFetchPromotions()
  const promoFlags = usePromoFlags()
  const profile = useProfile()

  useEffect(() => {
    if (promotions == null || promoFlags == null || profile == null) return

    const activePromotions = promotions.filter(promotion => {
      if (!testProfile(profile, promotion)) return false
      return testPromoFlags(promoFlags, promotion.appFlags)
    })
    setActivePromotions(activePromotions)
  }, [promotions, promoFlags, profile])

  return activePromotions
}

export const testPromoFlags = (appFlags: { [key: string]: boolean }, promoFlags: { [key: string]: boolean }) => {
  if (promoFlags == null) return true
  for (const key of Object.keys(promoFlags)) {
    if (promoFlags[key] !== appFlags[key]) return false
  }
  return true
}

export const testProfile = (profile: Profile, promotion: Promotion): boolean => {
  // Test appId
  if (profile.appId !== promotion.appId) return false

  // Test language
  if (promotion.message[profile.language] == null) return false

  // Test location
  if (promotion.locations[profile.location] == null) return false

  // Test platform
  if (profile.platform !== promotion.forPlatform) return false

  // Test dates
  const rightNow = new Date()
  if (rightNow < promotion.startDate || promotion.endDate < rightNow) return false

  // Test appVersion
  if (!testVersion(profile.appVersion, promotion.minVersion, promotion.maxVersion)) return false

  return true
}

// Test to see if the app version on device is within a range. Version formats must be in '12.34.56' format like returned from getVersion()
// Anything other than 0-9 will become NaN and compare as false
export const testVersion = (deviceVersion: string, minVersion: string, maxVersion: string): boolean => {
  const [device, min, max] = [deviceVersion, minVersion, maxVersion].map(semver =>
    Number(
      semver
        .split('.')
        .map(id => id.padStart(2, '0'))
        .join()
        .replace(/,/g, '')
    )
  )

  return min <= device && device <= max
}
