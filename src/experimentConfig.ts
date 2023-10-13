import { asObject, asOptional, asValue, Cleaner } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'
import { CreateAccountType } from 'edge-login-ui-rn'
import { isMaestro } from 'react-native-is-maestro'

import { LOCAL_EXPERIMENT_CONFIG } from './constants/constantSettings'
import { ENV } from './env'

// Persistent experiment config for A/B testing. Values initialized in this
// config persist throughout the liftetime of the app install.
export interface ExperimentConfig {
  swipeLastUsp: 'true' | 'false'
  createAccountType: CreateAccountType
  legacyLanding: 'legacyLanding' | 'uspLanding'
  createAccountText: 'signUp' | 'getStarted' | 'createAccount'
}

const DEFAULT_EXPERIMENT_CONFIG: ExperimentConfig = {
  swipeLastUsp: 'false',
  createAccountType: 'full',
  legacyLanding: 'uspLanding',
  createAccountText: 'createAccount'
}

const experimentConfigDisklet = makeReactNativeDisklet()

// The probability (0-1) of a feature config being set to the first value(s):
// the configuration that differs from the default feature configuration.
const experimentDistribution = {
  swipeLastUsp: [0.5],
  createAccountType: [0.5],
  legacyLanding: [0],
  createAccountText: [0.33, 0.33]
}

/**
 * Generate a random index value according to the experiment distribution to
 * determine which variant gets used.
 */
const generateExperimentConfigVal = <T>(key: keyof typeof experimentDistribution, configVals: T[]): T => {
  const variantProbability = experimentDistribution[key]

  if (variantProbability.length !== configVals.length - 1) {
    console.error(`Misconfigured experimentDistribution for: '${key}'`)
  } else {
    // Generate a random number between 0 and 1
    const random = Math.random()

    // Check which index the random number falls into and return the configVal:
    let lowerBound = 0
    for (let i = 0; i < variantProbability.length; i++) {
      if (random >= lowerBound && random < variantProbability[i]) return configVals[i]
      lowerBound += variantProbability[i]
    }
  }

  return configVals[configVals.length - 1]
}

// It's important to define string literals instead of booleans as values so
// that they are properly captured in the analytics dashboard reports. The first
// values are the variant values that differ from the default feature
// behavior/appearance, while the last value represents unchanged
// behavior/appearance.
const asExperimentConfig: Cleaner<ExperimentConfig> = asObject({
  swipeLastUsp: asOptional(asValue('true', 'false'), generateExperimentConfigVal('swipeLastUsp', ['true', 'false'])),
  createAccountType: asOptional(asValue('light', 'full'), generateExperimentConfigVal('createAccountType', ['light', 'full'])),
  legacyLanding: asOptional(asValue('uspLanding'), 'uspLanding'),
  createAccountText: asOptional(
    asValue('signUp', 'getStarted', 'createAccount'),
    generateExperimentConfigVal('createAccountText', ['signUp', 'getStarted', 'createAccount'])
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
    console.debug('Experiment config not found/out of date. Regenerating...')
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
 *
 * Can be overridden by isMaestro or env config: 'EXPERIMENT_CONFIG_OVERRIDE'
 */
export const getExperimentConfig = async (): Promise<ExperimentConfig> => {
  if (isMaestro()) return DEFAULT_EXPERIMENT_CONFIG // Test with forced defaults
  else if (ENV.EXPERIMENT_CONFIG_OVERRIDE != null && Object.keys(ENV.EXPERIMENT_CONFIG_OVERRIDE).length > 0) {
    try {
      console.debug('exp cfg override')
      return asExperimentConfig(ENV.EXPERIMENT_CONFIG_OVERRIDE)
    } catch (err) {
      console.error('Error applying ENV.EXPERIMENT_CONFIG_OVERRIDE: ', String(err))
      console.warn('Reverting to default experiment config.')
      return DEFAULT_EXPERIMENT_CONFIG
    }
  }
  return await experimentConfigPromise
}

/**
 * Returns the experiment config value
 */
export const getExperimentConfigValue = async <K extends keyof ExperimentConfig>(key: K): Promise<ExperimentConfig[K]> => {
  const config = await getExperimentConfig()
  return config[key]
}
