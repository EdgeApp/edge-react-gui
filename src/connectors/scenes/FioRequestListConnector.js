// @flow

import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioRequestListScene'
import { FioRequestList } from '../../components/scenes/FioRequestListScene'
import { getFioWallets, getSelectedWallet, getWallets } from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes'

const mapStateToProps = (state: RootState) => {
  const fioWallets = getFioWallets(state)
  const wallets = getWallets(state)
  const wallet = getSelectedWallet(state)
  const account = state.core.account
  if (!wallet) {
    const out: StateProps = {
      state,
      account,
      wallets: {},
      fioWallets: [],
      isConnected: state.network.isConnected
    }
    return out
  }

  const out: StateProps = {
    state,
    account,
    wallets,
    fioWallets,
    isConnected: state.network.isConnected
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
  }
})

export const FioRequestListConnector = connect(mapStateToProps, mapDispatchToProps)(FioRequestList)
