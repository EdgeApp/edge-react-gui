import { useState } from 'react'

import { DEFAULT_EXPERIMENT_CONFIG, ExperimentConfig, getExperimentConfig } from '../experimentConfig'
import { isMaestro } from '../util/maestro'
import { useAsyncEffect } from './useAsyncEffect'

// TODO: Create a new provider instead to serve the experimentConfig globally
export const useExperimentConfig = () => {
  const [experimentConfig, setExperimentConfig] = useState<ExperimentConfig | undefined>(isMaestro() ? DEFAULT_EXPERIMENT_CONFIG : undefined)

  // Wait for the experiment config to initialize before rendering anything
  useAsyncEffect(
    async () => {
      if (isMaestro()) return
      setExperimentConfig(await getExperimentConfig())
    },
    [],
    'setLegacyLanding'
  )

  return experimentConfig
}
