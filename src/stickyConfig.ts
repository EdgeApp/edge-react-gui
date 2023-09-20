import { asObject, asOptional, asValue } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import { CreateAccountType } from 'edge-login-ui-rn'

import { STICKY_CONFIG } from './constants/constantSettings'

export type StickyConfig = ReturnType<typeof asStickyConfig>

const stickyConfigDisklet = makeReactNativeDisklet()

// The probability of a feature config being set to the first value: the
// configuration that differs from the default feature configuration
const stickyDistribution = {
  swipeLastUsp: 0.5,
  createAccountType: 0.1,
  legacyLanding: 0.5
}

/**
 * Generate a random boolean value according to the sticky distribution
 */
const generateStickyConfigVal = (key: keyof typeof stickyDistribution): boolean => {
  return Math.random() < stickyDistribution[key]
}

// It's important to define string literals instead of booleans as values so
// that they are properly captured in the analytics dashboard reports. The first
// values is the variant value that differs from the default feature
// behavior/appearance, while the last value represents unchanged
// behavior/appearance
const asStickyConfig = asObject({
  // Allow dismissing the last USP via swiping
  swipeLastUsp: asOptional<'true' | 'false'>(asValue('true', 'false'), generateStickyConfigVal('swipeLastUsp') ? 'true' : 'false'),

  // 'Light' username-less accounts vs full username'd accounts
  createAccountType: asOptional<CreateAccountType>(asValue('light', 'full'), generateStickyConfigVal('createAccountType') ? 'light' : 'full'),

  // Legacy landing page, replaces USP landing
  legacyLanding: asOptional<'legacyLanding' | 'uspLanding'>(
    asValue('legacyLanding', 'uspLanding'),
    generateStickyConfigVal('legacyLanding') ? 'legacyLanding' : 'uspLanding'
  )
})

/**
 * Immediately initialize the 'sticky config' as soon as the module loads.
 * This config value is available through the module's getter functions.
 */
const stickyConfigPromise: Promise<StickyConfig> = (async (): Promise<StickyConfig> => {
  try {
    const stickyConfigJson = await stickyConfigDisklet.getText(STICKY_CONFIG)
    return asStickyConfig(JSON.parse(stickyConfigJson))
  } catch (err) {
    // Not found or incompatible. Re-generate with random values according to
    // the defined distribution.
    const generatedStickyConfig = asStickyConfig({})
    await stickyConfigDisklet.setText(STICKY_CONFIG, JSON.stringify(generatedStickyConfig))
    return generatedStickyConfig
  }
})()

/**
 * Initializes the local 'sticky config' file containing the randomly generated
 * variant values. This is used for variant values that are required prior to
 * the initialization of the fetched config. Once generated, values 'stick'
 * until the config type changes.
 */
export const getStickyConfig = async (): Promise<StickyConfig> => {
  return await stickyConfigPromise
}

/**
 * Returns the sticky config value
 */
export const getStickyConfigValue = async <K extends keyof StickyConfig>(key: K): Promise<StickyConfig[K]> => {
  const config = await getStickyConfig()
  return config[key]
}
