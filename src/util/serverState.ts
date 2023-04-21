//
// Holds global server state that we don't want or are too lazy to hold in
// redux.
//
// WARNING: Since this is not in redux, changes to server state will not
// cause a re-render. This state should be queried as needed before a
// render that is trigger via UI interaction
//

import { asBoolean, asObject } from 'cleaners'

import { config } from '../theme/appConfig'
import { fetchInfo } from './network'

const asAssetOverrides = asObject({
  // Currency pluginIds as key
  disable: asObject(asBoolean)
})

type AssetOverrides = ReturnType<typeof asAssetOverrides>

export const assetOverrides: AssetOverrides = { disable: {} }

export const updateAssetOverrides = async () => {
  const appId = config.appId ?? 'edge'
  try {
    const response = await fetchInfo(`v1/assetOverrides/${appId}`)
    if (!response.ok) {
      const text = await response.text()
      console.warn(`Failed to fetch assetOverrides: ${text}`)
      return
    }
    const replyJson = await response.json()
    const overrides = asAssetOverrides(replyJson)
    assetOverrides.disable = overrides.disable
  } catch (e: any) {
    console.warn(`Failed to fetch assetOverrides: ${e.message}`)
  }
}
