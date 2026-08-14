import { asMaybe, asObject, asOptional, asString } from 'cleaners'

import { pluginMaps } from '../pluginMaps'

const asPhazeConfig = asMaybe(
  asObject({
    apiKey: asOptional(asString),
    baseUrl: asOptional(asString)
  })
)

export function getPhazeConfig():
  | { apiKey?: string; baseUrl?: string }
  | undefined {
  return asPhazeConfig(pluginMaps.guiApiKeys.phaze) ?? undefined
}
