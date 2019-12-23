// @flow

import { connect } from 'react-redux'

import { selectWalletFromModal } from '../../actions/WalletActions'
import type { DispatchProps, StateProps } from '../../components/common/HeaderWalletSelector'
import { HeaderWalletSelector } from '../../components/common/HeaderWalletSelector'
import type { Dispatch, State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State): StateProps => {
  return {
    wallets: state.ui.wallets.byId,
    state
  }
}

export const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch(selectWalletFromModal(walletId, currencyCode))
  }
})

const HeaderWalletSelectorConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(HeaderWalletSelector)

export { HeaderWalletSelectorConnector }
