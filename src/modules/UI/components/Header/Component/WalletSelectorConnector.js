// @flow

import React from 'react'
import {connect} from 'react-redux'
import type {State, Dispatch} from '../../../../ReduxTypes'
import WalletSelector from './WalletSelector.ui'
import type {StateProps, DispatchProps} from './WalletSelector.ui'
import {WalletNameHeader} from './WalletNameHeader.ui'
import * as UI_SELECTORS from '../../../selectors'
import s from '../../../../../locales/strings.js'
import {
  toggleSelectedWalletListModal,
  toggleScanToWalletListModal
} from '../../WalletListModal/action'

const mapStateToProps = (state: State): StateProps => {
  const selectedWallet = UI_SELECTORS.getSelectedWallet(state)
  const selectedWalletCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const title = selectedWallet
    ? function HeaderComp (styles) {
      return (<WalletNameHeader name={selectedWallet.name} denomination={selectedWalletCurrencyCode} styles={styles}/>)
    }
  : s.strings.loading
  return { title }
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onPress: () => {
    dispatch(toggleSelectedWalletListModal())
    dispatch(toggleScanToWalletListModal())
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(WalletSelector)
