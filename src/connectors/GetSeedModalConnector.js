// @flow

import { connect } from 'react-redux'

import GetSeedModal from '../components/modals/GetSeedModal'
import type { GetSeedModalDispatchProps, GetSeedModalStateProps } from '../components/modals/GetSeedModal'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { Dispatch, GetState, State } from '../modules/ReduxTypes'

const checkCurrentPassword = (password: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const isPassword = await account.checkPassword(password)

  if (isPassword) {
    dispatch({ type: 'UNLOCK_WALLET_SEED' })
  } else {
    dispatch({ type: 'LOCK_WALLET_SEED' })
  }
}

const mapStateToProps = (state: State): GetSeedModalStateProps => {
  const wallet = CORE_SELECTORS.getWallet(state, state.ui.scenes.walletList.walletId)
  const walletId = state.ui.scenes.walletList.walletId
  const walletName = CORE_SELECTORS.getWalletName(state, walletId)

  return {
    privateSeedUnlocked: state.ui.scenes.walletList.privateSeedUnlocked,
    wallet,
    walletName,
    visibilityBoolean: state.ui.scenes.walletList.getSeedWalletModalVisible
  }
}

const mapDispatchToProps = (dispatch: Dispatch): GetSeedModalDispatchProps => {
  const close = () => {
    dispatch({ type: 'CLOSE_GETSEED_WALLET_MODAL' })
    dispatch({ type: 'LOCK_WALLET_SEED' })
  }

  return {
    onExitButtonFxn: close,
    onNegative: () => dispatch({ type: 'LOCK_WALLET_SEED' }),
    onPositive: (password: string) => dispatch(checkCurrentPassword(password)),
    onDone: close
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GetSeedModal)
