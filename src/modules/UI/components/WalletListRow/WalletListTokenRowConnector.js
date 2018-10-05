// @flow

import { bns } from 'biggystring'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes'
import { DIVIDE_PRECISION, getSettingsTokenMultiplier } from '../../../utils.js'
import { convertCurrency } from '../../selectors.js'
import { WalletListTokenRowComponent } from './WalletListTokenRow.ui.js'
import type { WalletListTokenRowDispatchProps, WalletListTokenRowOwnProps, WalletListTokenRowStateProps } from './WalletListTokenRow.ui.js'

const mapStateToProps = (state: State, ownProps: WalletListTokenRowOwnProps): WalletListTokenRowStateProps => {
  const settings = state.ui.settings
  let fiatValue = 0
  const denomination = ownProps.wallet.allDenominations[ownProps.currencyCode]
  const multiplier = getSettingsTokenMultiplier(ownProps.currencyCode, settings, denomination)
  const nativeBalance = ownProps.metaTokenBalances[ownProps.currencyCode]
  const cryptoAmount = parseFloat(bns.div(nativeBalance, multiplier, DIVIDE_PRECISION))
  fiatValue = convertCurrency(state, ownProps.currencyCode, ownProps.wallet.isoFiatCurrencyCode, cryptoAmount)
  return {
    fiatValue,
    cryptoAmount
  }
}
const mapDispatchToProps = (dispatch: Dispatch): WalletListTokenRowDispatchProps => {
  return {}
}

export const WalletListTokenRowConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletListTokenRowComponent)
