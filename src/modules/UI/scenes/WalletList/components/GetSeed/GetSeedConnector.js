// @flow

import {connect} from 'react-redux'

import GetSeed from './GetSeed.ui'
import type {State, Dispatch, GetState} from '../../../../../ReduxTypes'
import * as Constants from '../../../../../../constants/indexConstants'
import {CLOSE_MODAL_VALUE} from '../WalletOptions/action'
import * as CORE_SELECTORS from '../../../../../Core/selectors.js'

export type StateProps = {
  walletId: string,
  getSeed: any
}

export type DispatchProps = {
  onPositive: (password: string) => any,
  onNegative: () => any,
  onDone: () => any
}

export const UNLOCK = 'UNLOCK_WALLET_SEED'
export const LOCK = 'LOCK_WALLET_SEED'

export const checkCurrentPassword = (password: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const isPassword = await account.checkPassword(password)
  return isPassword ? UNLOCK : LOCK
}

const mapStateToProps = (state: any): StateProps => {
  const wallet = CORE_SELECTORS.getWallet(state, state.ui.scenes.walletList.walletId)

  return {
    getSeed: wallet ? wallet.getDisplayPrivateSeed : () => {},
    walletId: state.ui.scenes.walletList.walletId,
    privateSeedLocked: state.ui.scenes.walletList.privateSeedLocked
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (password: string) => dispatch({ type: checkCurrentPassword(password) }),
  onDone: () => {
    dispatch({ type: CLOSE_MODAL_VALUE(Constants.WALLET_OPTIONS.GET_SEED.value) })
    dispatch({ type: LOCK })
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(GetSeed)
