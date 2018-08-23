// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../ReduxTypes'
import * as UI_SELECTORS from '../../../selectors'
import { toggleScanToWalletListModal, toggleWalletListModalVisibility } from '../../WalletListModal/action'
import WalletSelector from './WalletSelector.ui'
import type { DispatchProps, StateProps } from './WalletSelector.ui'

const mapStateToProps = (state: State): StateProps => {
  const selectedWallet = UI_SELECTORS.getSelectedWallet(state)
  const selectedWalletCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  return {
    selectedWalletName: selectedWallet ? selectedWallet.name : null,
    selectedWalletCurrencyCode
  }
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onPress: () => {
    dispatch(toggleWalletListModalVisibility())
    dispatch(toggleScanToWalletListModal())
  }
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletSelector)
