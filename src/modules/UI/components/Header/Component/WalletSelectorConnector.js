// @flow

import React from 'react'
import { connect } from 'react-redux'

import s from '../../../../../locales/strings.js'
import type { Dispatch, State } from '../../../../ReduxTypes'
import * as UI_SELECTORS from '../../../selectors'
import { toggleScanToWalletListModal, toggleWalletListModalVisibility } from '../../WalletListModal/action'
import { WalletNameHeader } from './WalletNameHeader.ui'
import WalletSelector from './WalletSelector.ui'
import type { DispatchProps, StateProps } from './WalletSelector.ui'

const mapStateToProps = (state: State): StateProps => {
  const selectedWallet = UI_SELECTORS.getSelectedWallet(state)
  const selectedWalletCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const title = selectedWallet
    ? function HeaderComp (styles) {
      return <WalletNameHeader name={selectedWallet.name} denomination={selectedWalletCurrencyCode} styles={styles} />
    }
    : s.strings.loading
  return { title }
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onPress: () => {
    dispatch(toggleWalletListModalVisibility())
    dispatch(toggleScanToWalletListModal())
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(WalletSelector)
