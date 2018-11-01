// @flow

import type { EdgeDenomination } from 'edge-core-js'
import { connect } from 'react-redux'

import { selectWallet } from '../actions/WalletActions'
import type { DispatchProps, StateProps } from '../components/common/WalletListTokenRow.js'
import { WalletListTokenRow } from '../components/common/WalletListTokenRow.js'
import type { Dispatch, State } from '../modules/ReduxTypes'
import * as SETTINGS_SELECTORS from '../modules/Settings/selectors'
import { getWallet } from '../modules/UI/selectors.js'
import { getCurrencyAccountFiatBalanceFromWallet } from '../util/utils.js'

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
