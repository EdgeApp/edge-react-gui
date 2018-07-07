// @flow

import type { EdgeDenomination } from 'edge-core-js'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import { getCurrencyConverter } from '../../../../../Core/selectors.js'
import { intl } from '../../../../../../locales/intl.js'
import { getWallet } from '../../../../selectors.js'
import { selectWallet } from '../../../../Wallets/action'
import {
  convertNativeToExchange
} from '../../../../../utils.js'

import { type StateProps, type DispatchProps, WalletListTokenRow } from './WalletListTokenRow.ui.js'

const mapStateToProps = (state: State, ownProps): StateProps => {
  const isWalletFiatBalanceVisible = state.ui.settings.isWalletFiatBalanceVisible
  const currencyCode: string = ownProps.currencyCode
  // $FlowFixMe
  const displayDenomination: EdgeDenomination = SETTINGS_SELECTORS.getDisplayDenominationFull(state, currencyCode)
  const denominationIndex = SETTINGS_SELECTORS.getDisplayDenominationKey(state, currencyCode)
  const wallet = getWallet(state, ownProps.parentId)
  const balanceInCrypto = wallet.nativeBalances[currencyCode]
  const denominationsOnWallet = wallet.allDenominations[currencyCode]
  let denomination
  if (denominationsOnWallet) {
    denomination = denominationsOnWallet[denominationIndex]
  } else {
    const customTokens = SETTINGS_SELECTORS.getCustomTokens(state)
    const customTokenIndex = _.findIndex(customTokens, item => item.currencyCode === currencyCode)
    let fiatBalance
    if (customTokens.length > 0) {
      denomination = {
        ...customTokens[customTokenIndex].denominations[0],
        name: currencyCode,
        symbol: ''
      }
    }
  }

  const multiplier = denomination.multiplier
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, currencyCode)
  // $FlowFixMe
  const balanceInCryptoDisplay = convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const currencyConverter = getCurrencyConverter(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  fiatBalance = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay)
  const formattedFiatBalance = intl.formatNumber(fiatBalance, { toFixed: 2})
  return {
    displayDenomination,
    fiatBalance: formattedFiatBalance,
    isWalletFiatBalanceVisible
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListTokenRow)
