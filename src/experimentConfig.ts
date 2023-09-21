import { asObject, asOptional, asValue } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import { CreateAccountType } from 'edge-login-ui-rn'

import { LOCAL_EXPERIMENT_CONFIG } from './constants/constantSettings'

// Persistent experiment config for A/B testing. Values initialized in this
// config persist throughout the liftetime of the app install.
export type ExperimentConfig = ReturnType<typeof asExperimentConfig>

const experimentConfigDisklet = makeReactNativeDisklet()

// The probability of a feature config being set to the first value: the
// configuration that differs from the default feature configuration
const experimentDistribution = {
  swipeLastUsp: 0.5,
  createAccountType: 0.1,
  legacyLanding: 0.5
}

/**
 * Generate a random boolean value according to the experiment distribution
 */
const generateExperimentConfigVal = (key: keyof typeof experimentDistribution): boolean => {
  return Math.random() < experimentDistribution[key]
}

// It's important to define string literals instead of booleans as values so
// that they are properly captured in the analytics dashboard reports. The first
// values is the variant value that differs from the default feature
// behavior/appearance, while the last value represents unchanged
// behavior/appearance
const asExperimentConfig = asObject({
  // Allow dismissing the last USP via swiping
  swipeLastUsp: asOptional<'true' | 'false'>(asValue('true', 'false'), generateExperimentConfigVal('swipeLastUsp') ? 'true' : 'false'),

  // 'Light' username-less accounts vs full username'd accounts
  createAccountType: asOptional<CreateAccountType>(asValue('light', 'full'), generateExperimentConfigVal('createAccountType') ? 'light' : 'full'),

  // Legacy landing page, replaces USP landing
  legacyLanding: asOptional<'legacyLanding' | 'uspLanding'>(
    asValue('legacyLanding', 'uspLanding'),
    generateExperimentConfigVal('legacyLanding') ? 'legacyLanding' : 'uspLanding'
  )
})

/**
 * Immediately initialize the experiment config as soon as the module loads.
 * This config value is available through the module's getter functions.
 */
const experimentConfigPromise: Promise<ExperimentConfig> = (async (): Promise<ExperimentConfig> => {
  try {
    const experimentConfigJson = await experimentConfigDisklet.getText(LOCAL_EXPERIMENT_CONFIG)
    return asExperimentConfig(JSON.parse(experimentConfigJson))
  } catch (err) {
    // Not found or incompatible. Re-generate with random values according to
    // the defined distribution.
    const generatedExperimentConfig = asExperimentConfig({})
    await experimentConfigDisklet.setText(LOCAL_EXPERIMENT_CONFIG, JSON.stringify(generatedExperimentConfig))
    return generatedExperimentConfig
  }
})()

/**
 * Initializes the local experiment config file containing the randomly
 * generated variant values. This is used for variant values that are required
 * prior to the initialization of the fetched config. Once generated, values
 * 'stick' until the config type changes.
 */
export const getExperimentConfig = async (): Promise<ExperimentConfig> => {
  return await experimentConfigPromise
}

/**
 * Returns the experiment config value
 */
export const getExperimentConfigValue = async <K extends keyof ExperimentConfig>(key: K): Promise<ExperimentConfig[K]> => {
  const config = await getExperimentConfig()
  return config[key]
}
