//
// Holds global server state that we don't want or are too lazy to hold in
// redux.
//
// WARNING: Since this is not in redux, changes to server state will not
// cause a re-render. This state should be queried as needed before a
// render that is trigger via UI interaction
//

import { asBoolean, asMap, asObject } from 'cleaners'

export const asAssetOverrides = asObject({
  // Currency pluginIds as key
  disable: asMap(asBoolean)
})

export type AssetOverrides = ReturnType<typeof asAssetOverrides>

export const assetOverrides: AssetOverrides = { disable: {} }
