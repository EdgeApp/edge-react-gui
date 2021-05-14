// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import _ from 'lodash'

import type { CustomTokenInfo } from '../../../types/types.js'

// will take the metaTokens property on the wallet (that comes from currencyInfo), merge with account-level custom tokens added, and only return if enabled (wallet-specific)
// $FlowFixMe
export const mergeTokens = (preferredEdgeMetaTokens: $ReadOnly<EdgeMetaToken | CustomTokenInfo>[], edgeMetaTokens: CustomTokenInfo[]) => {
  const tokensEnabled = [...preferredEdgeMetaTokens] // initially set the array to currencyInfo (from plugin), since it takes priority
  for (const x of edgeMetaTokens) {
    // loops through the account-level array
    let found = false // assumes it is not present in the currencyInfo from plugin
    for (const val of tokensEnabled) {
      // loops through currencyInfo array to see if already present
      if (x.currencyCode === val.currencyCode) {
        found = true // if present, then set 'found' to true
      }
    }
    if (!found) tokensEnabled.push(x) // if not already in the currencyInfo, then add to tokensEnabled array
  }
  return tokensEnabled
}

export const mergeTokensRemoveInvisible = (preferredEdgeMetaTokens: EdgeMetaToken[], edgeMetaTokens: CustomTokenInfo[]): EdgeMetaToken[] => {
  const tokensEnabled: EdgeMetaToken[] = [...preferredEdgeMetaTokens] // initially set the array to currencyInfo (from plugin), since it takes priority
  const tokensToAdd = []
  for (const x of edgeMetaTokens) {
    // loops through the account-level array
    if (x.isVisible !== false && _.findIndex(tokensEnabled, walletToken => walletToken.currencyCode === x.currencyCode) === -1) {
      tokensToAdd.push(x)
    }
  }

  // $FlowFixMe this is actually an error, but I don't know how to fix it:
  return tokensEnabled.concat(tokensToAdd)
}
