import { ENV } from '../../env'

export interface PhazeConfig {
  apiKey: string
  baseUrl: string
}

/**
 * True when this build targets the Phaze sandbox environment, using the
 * `PLUGIN_API_KEYS.phaze.sandbox` credentials from env.json.
 *
 * This is a code constant rather than an env.json flag because one env.json
 * serves every build. Flip it to `true` on a test branch only; it must
 * never land as `true`.
 */
export const PHAZE_SANDBOX_ENABLED: boolean = false

/**
 * Resolve the Phaze credentials for the environment this build targets.
 * Returns undefined when the selected environment has no credentials
 * configured, which hides the gift card entry points.
 */
export const getPhazeConfig = (): PhazeConfig | undefined => {
  const phaze = ENV.PLUGIN_API_KEYS?.phaze
  if (phaze == null) return undefined
  if (PHAZE_SANDBOX_ENABLED) return phaze.sandbox
  return { apiKey: phaze.apiKey, baseUrl: phaze.baseUrl }
}
