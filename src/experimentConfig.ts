import { asMaybe, asObject, asValue, Cleaner } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'

import { LOCAL_EXPERIMENT_CONFIG } from './constants/constantSettings'
import { ENV } from './env'
import { isMaestro } from './util/maestro'

export type UspSigninCtaType = 'alreadyHaveAccount' | 'signIn'

// Persistent experiment config for A/B testing. Values initialized in this
// config persist throughout the liftetime of the app install.
export interface ExperimentConfig {
  signupCaptcha: 'withCaptcha' | 'withoutCaptcha'
  uspSigninCta: UspSigninCtaType
}

// Defined default "unchanged" values before experimentation.
export const DEFAULT_EXPERIMENT_CONFIG: ExperimentConfig = {
  signupCaptcha: 'withoutCaptcha',
  uspSigninCta: 'alreadyHaveAccount'
}

const experimentConfigDisklet = makeReactNativeDisklet()

// The probability of an experiment config feature being set for a given key
const experimentDistribution = {
  signupCaptcha: [50, 50],
  uspSigninCta: [50, 50]
}

/**
 * Generate a random index value according to the experiment distribution to
 * determine which variant gets used.
 */
const generateExperimentConfigVal = <T>(key: keyof typeof experimentDistribution, configVals: T[]): T => {
  const variantNominations = experimentDistribution[key]

  if (variantNominations.length !== configVals.length) {
    console.error(`Misconfigured experimentDistribution for: '${key}'`)
  } else {
    // Distribute the probability of each config value
    const variantDenomination = variantNominations.reduce((sum, probability) => sum + probability, 0)
    if (variantDenomination === 0) {
      throw new Error(`Config values for '${key}' do not add up to 100%`)
    } else if (variantDenomination > 101 || variantDenomination < 99) {
      console.warn(`Config values for '${key}' do not add up to 100% +/- 1%`)
    }
    const distributedProbabilities = variantNominations.map(variantNomination => variantNomination / variantDenomination)

    // Generate a random number between 0 and 1
    const random = Math.random()

    // Check which index the random number falls into and return the configVal:
    let lowerBound = 0
    let upperBound = distributedProbabilities[0]
    for (let i = 0; i < distributedProbabilities.length; i++) {
      if (random >= lowerBound && random < upperBound) return configVals[i]

      lowerBound = upperBound
      upperBound += distributedProbabilities[i]
    }
  }

  return configVals[configVals.length - 1]
}

const asExperimentConfig: Cleaner<ExperimentConfig> = asObject({
  signupCaptcha: asMaybe(asValue('withoutCaptcha', 'withCaptcha'), generateExperimentConfigVal('signupCaptcha', ['withoutCaptcha', 'withCaptcha'])),
  uspSigninCta: asMaybe(asValue('alreadyHaveAccount', 'signIn'), generateExperimentConfigVal('uspSigninCta', ['alreadyHaveAccount', 'signIn']))
})

/**
 * Immediately initialize the experiment config as soon as the module loads.
 * This config value is available through the module's getter functions.
 */
const experimentConfigPromise: Promise<ExperimentConfig> = (async (): Promise<ExperimentConfig> => {
  let currentConfig: ExperimentConfig
  try {
    const experimentConfigJson = await experimentConfigDisklet.getText(LOCAL_EXPERIMENT_CONFIG)
    currentConfig = asExperimentConfig(JSON.parse(experimentConfigJson))
  } catch (err) {
    console.log('Experiment config not found/out of date. Regenerating...')
    // Not found or incompatible. Re-generate with random values according to
    // the defined distribution.
    currentConfig = asExperimentConfig({})
  }

  await experimentConfigDisklet.setText(LOCAL_EXPERIMENT_CONFIG, JSON.stringify(currentConfig))
  return currentConfig
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
      console.log('ENV.EXPERIMENT_CONFIG_OVERRIDE set')
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
