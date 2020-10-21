// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import WalletListTokenRow from '../../connectors/WalletListTokenRowConnector.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import { emptyEdgeDenomination } from '../../modules/Settings/selectors.js'
import { calculateWalletFiatBalanceWithoutState, getActiveWalletIds } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, FlatListItem, GuiWallet } from '../../types/types.js'
import { decimalOrZero, getFiatSymbol, getYesterdayDateRoundDownHour, truncateDecimals } from '../../util/utils.js'
import { WalletListEmptyRow } from './WalletListEmptyRow.js'
import { styles as currencyRowStyles, WalletListRow } from './WalletListRow.js'

const DIVIDE_PRECISION = 18

type WalletListItem = { id: string, fullCurrencyCode: string, balance: string }

type OwnProps = {
  header?: any,
  footer?: any
}

type StateProps = {
  activeWalletIds: string[],
  customTokens: CustomTokenInfo[],
  exchangeRates: { [string]: number },
  showBalance: boolean,
  settings: Object,
  wallets: { [walletId: string]: GuiWallet },
  walletsProgress: Object
}

type Props = OwnProps & StateProps

class WalletListComponent extends React.PureComponent<Props> {
  getWalletList(activeWalletIds: string[], wallets: { [walletId: string]: GuiWallet }): WalletListItem[] {
    const walletList = []

    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]
      const { enabledTokens, nativeBalances } = wallet
      const { customTokens } = this.props

      walletList.push({
        id: walletId,
        fullCurrencyCode: wallet.currencyCode,
        balance: nativeBalances[wallet.currencyCode]
      })

      // Old logic on getting tokens
      const enabledNotHiddenTokens = enabledTokens.filter(token => {
        let isVisible = true // assume we will enable token
        const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
        // if token is not supposed to be visible, not point in enabling it
        if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
        if (SYNCED_ACCOUNT_DEFAULTS[token] && enabledTokens.includes(token)) {
          // if hardcoded token
          isVisible = true // and enabled then make visible (overwrite customToken isVisible flag)
        }
        return isVisible
      })

      for (const currencyCode in nativeBalances) {
        if (nativeBalances.hasOwnProperty(currencyCode)) {
          if (currencyCode !== wallet.currencyCode && enabledNotHiddenTokens.indexOf(currencyCode) >= 0) {
            walletList.push({
              id: walletId,
              fullCurrencyCode: `${wallet.currencyCode}-${currencyCode}`,
              balance: nativeBalances[currencyCode]
            })
          }
        }
      }
    }

    return walletList
  }

  getWalletProgress(walletId: string): number {
    const walletProgress = this.props.walletsProgress[walletId]

    if (walletProgress === 1) {
      return 1
    }
    if (walletProgress < 0.1) {
      return 0.1
    }
    if (walletProgress > 0.95) {
      return 0.95
    }

    return walletProgress
  }

  getDenomination(guiWallet: GuiWallet, currencyCode: string) {
    const { settings } = this.props
    const denominationMultiplier = settings[currencyCode].denomination
    const denomination = settings[currencyCode].denominations.find(denomination => denomination.multiplier === denominationMultiplier)
    return denomination || emptyEdgeDenomination
  }

  render() {
    const { activeWalletIds, footer, header, wallets } = this.props
    const walletList = this.getWalletList(activeWalletIds, wallets)

    return <FlatList style={StyleSheet.absoltueFill} data={walletList} renderItem={this.renderRow} ListHeaderComponent={header} ListFooterComponent={footer} />
  }

  renderRow = (data: FlatListItem<WalletListItem>) => {
    const { exchangeRates, settings, showBalance, wallets } = this.props
    const walletId = data.item.id
    const guiWallet = wallets[walletId]
    const { currencyCode } = guiWallet
    const walletFiatSymbol = getFiatSymbol(guiWallet.isoFiatCurrencyCode)
    const walletProgress = this.getWalletProgress(walletId)

    // Crypto Amount And Exchange Rate
    const denomination = this.getDenomination(guiWallet, currencyCode)
    const { multiplier, symbol } = denomination
    const preliminaryCryptoAmount = truncateDecimals(bns.div(guiWallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    const finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
    const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
    const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : null

    // Fiat Balance
    const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
    const fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''

    // Currency Exhange Rate
    const exchangeRateFormat = exchangeRate ? intl.formatNumber(exchangeRate, { toFixed: 2 }) : null
    const exchangeRateFiatSymbol = exchangeRateFormat ? `${walletFiatSymbol} ` : ''
    const exchangeRateString = exchangeRateFormat ? `${exchangeRateFormat}/${currencyCode}` : s.strings.no_exchange_rate

    // Yesterdays Percentage Difference
    const yesterdayUsdExchangeRate = exchangeRates[`${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`]
    const fiatExchangeRate = guiWallet.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${guiWallet.isoFiatCurrencyCode}`] : 1
    const yesterdayExchangeRate = yesterdayUsdExchangeRate * fiatExchangeRate
    const differenceYesterday = exchangeRate ? exchangeRate - yesterdayExchangeRate : null
    let differencePercentage = differenceYesterday ? (differenceYesterday / yesterdayExchangeRate) * 100 : null
    if (!yesterdayExchangeRate) {
      differencePercentage = ''
    }

    let differencePercentageString, differencePercentageStringStyle
    if (!exchangeRate || !differencePercentage || isNaN(differencePercentage)) {
      differencePercentageStringStyle = currencyRowStyles.walletDetailsRowDifferenceNeutral
      differencePercentageString = ''
    } else if (exchangeRate && differencePercentage && differencePercentage === 0) {
      differencePercentageStringStyle = currencyRowStyles.walletDetailsRowDifferenceNeutral
      differencePercentageString = '0.00%'
    } else if (exchangeRate && differencePercentage && differencePercentage < 0) {
      differencePercentageStringStyle = currencyRowStyles.walletDetailsRowDifferenceNegative
      differencePercentageString = `- ${Math.abs(differencePercentage).toFixed(2)}%`
    } else if (exchangeRate && differencePercentage && differencePercentage > 0) {
      differencePercentageStringStyle = currencyRowStyles.walletDetailsRowDifferencePositive
      differencePercentageString = `+ ${Math.abs(differencePercentage).toFixed(2)}%`
    }

    if (guiWallet == null) {
      return <WalletListEmptyRow walletId={walletId} />
    }

    if (guiWallet.currencyCode === data.item.fullCurrencyCode) {
      return (
        <WalletListRow
          differencePercentage={differencePercentageString}
          differencePercentageStyle={differencePercentageStringStyle}
          exchangeRate={exchangeRateString}
          exchangeRateFiatSymbol={exchangeRateFiatSymbol}
          fiatBalance={fiatBalanceString}
          fiatBalanceSymbol={fiatBalanceSymbol}
          cryptoAmount={finalCryptoAmountString}
          guiWallet={guiWallet}
          walletProgress={walletProgress}
        />
      )
    }

    const walletCodesArray = data.item.fullCurrencyCode.split('-')
    const tokenCode = walletCodesArray[1]

    return (
      <WalletListTokenRow
        parentId={walletId}
        currencyCode={tokenCode}
        key={tokenCode}
        walletFiatSymbol={walletFiatSymbol}
        balance={data.item.balance}
        showBalance={showBalance}
        progress={walletProgress}
      />
    )
  }
}

export const WalletList = connect((state: RootState): StateProps => {
  let activeWalletIds = getActiveWalletIds(state)

  // FIO disable changes below
  if (global.isFioDisabled) {
    const { currencyWallets = {} } = state.core.account
    activeWalletIds = activeWalletIds.filter(id => {
      const wallet = currencyWallets[id]
      return wallet == null || wallet.type !== 'wallet:fio'
    })
  }

  return {
    activeWalletIds,
    customTokens: state.ui.settings.customTokens,
    exchangeRates: state.exchangeRates,
    showBalance: state.ui.settings.isAccountBalanceVisible,
    settings: state.ui.settings,
    wallets: state.ui.wallets.byId,
    walletsProgress: state.ui.wallets.walletLoadingProgress
  }
})(WalletListComponent)
