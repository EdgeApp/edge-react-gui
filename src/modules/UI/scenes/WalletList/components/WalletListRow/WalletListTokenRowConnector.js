// @flow

import type { EdgeDenomination } from 'edge-core-js'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import { getCurrencyAccountFiatBalanceFromWallet } from '../../../../../utils.js'
import { getWallet } from '../../../../selectors.js'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import { selectWallet } from '../../../../Wallets/action'
import type { DispatchProps, StateProps } from './WalletListTokenRow.ui.js'
import { WalletListTokenRow } from './WalletListTokenRow.ui.js'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const isWalletFiatBalanceVisible = state.ui.settings.isWalletFiatBalanceVisible
  const currencyCode: string = ownProps.currencyCode
  // $FlowFixMe
  const displayDenomination: EdgeDenomination = SETTINGS_SELECTORS.getDisplayDenominationFull(state, currencyCode)
  const wallet = getWallet(state, ownProps.parentId)

  const formattedFiatBalance = getCurrencyAccountFiatBalanceFromWallet(wallet, currencyCode, state)
  return {
    displayDenomination,
    fiatBalance: formattedFiatBalance,
    isWalletFiatBalanceVisible
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletListTokenRow)
