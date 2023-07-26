import { asBoolean, asObject, asOptional } from 'cleaners'

/**
 * Firebase Remote Config Defaults/Cleaners
 */
export const asFbRemoteConfig = asObject({
  swipe_last_usp: asOptional(asBoolean, true),
  awesome_new_feature: asOptional(asBoolean, true)
})
