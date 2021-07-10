// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import _ from 'lodash'

import { refreshConnectedWallets } from '../../../actions/FioActions.js'
import { registerNotifications } from '../../../actions/NotificationActions.js'
import { getEnabledTokens } from '../../../actions/WalletActions.js'
import type { Dispatch, GetState } from '../../../types/reduxTypes.js'
import { getReceiveAddresses } from '../../../util/utils.js'

export const updateWalletsRequest = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { activeWalletIds, archivedWalletIds, currencyWallets } = account

  if (activeWalletIds.length === Object.keys(currencyWallets).length) {
    dispatch(registerNotifications())
  }

  const incomingWalletIds = activeWalletIds.filter(id => state.ui.wallets.byId[id] == null)
  const receiveAddresses = await getReceiveAddresses(currencyWallets)

  dispatch({
    type: 'CORE/WALLETS/UPDATE_WALLETS',
    data: {
      activeWalletIds,
      archivedWalletIds,
      currencyWallets,
      receiveAddresses
    }
  })
  const newState = getState()
  for (const walletId of incomingWalletIds) {
    if (newState.ui.wallets.byId[walletId] == null) continue
    await getEnabledTokens(walletId)(dispatch, getState)
  }
  refreshConnectedWallets(dispatch, getState, currencyWallets)
  updateWalletsEnabledTokens(getState)
}

export const updateWalletsEnabledTokens = (getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { currencyWallets } = account
  for (const walletId: string of Object.keys(currencyWallets)) {
    const edgeWallet: EdgeCurrencyWallet = currencyWallets[walletId]
    if (edgeWallet.type === 'wallet:ethereum' || edgeWallet.type === 'wallet:rsk' || edgeWallet.type === 'wallet:fantom') {
      if (state.ui.wallets && state.ui.wallets.byId && state.ui.wallets.byId[walletId]) {
        const enabledTokens = state.ui.wallets.byId[walletId].enabledTokens
        const customTokens = state.ui.settings.customTokens
        const enabledNotHiddenTokens = enabledTokens.filter(token => {
          let isVisible = true // assume we will enable token
          const tokenIndex = _.findIndex(customTokens, item => item.currencyCode === token)
          // if token is not supposed to be visible, not point in enabling it
          if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
          return isVisible
        })
        edgeWallet.changeEnabledTokens(enabledNotHiddenTokens)
      }
    }
  }
}
