// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { RefreshControl } from 'react-native'
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view'
import { connect } from 'react-redux'

import { selectWallet } from '../../actions/WalletActions.js'
import { WALLET_LIST_SCENE } from '../../constants/indexConstants.js'
import { formatNumber } from '../../locales/intl.js'
import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import { calculateWalletFiatBalanceWithoutState, getActiveWalletIds } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, FlatListItem, GuiWallet } from '../../types/types.js'
import {
  checkFilterToken,
  checkFilterWallet,
  convertNativeToDisplay,
  decimalOrZero,
  getDenomination,
  getFiatSymbol,
  getYesterdayDateRoundDownHour,
  truncateDecimals
} from '../../util/utils'
import { type SortOption } from '../modals/WalletListSortModal.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { WalletListEmptyRow } from './WalletListEmptyRow.js'
import { WalletListRow } from './WalletListRow.js'

type WalletListItem = { id: string, fullCurrencyCode?: string, key: string }

const DIVIDE_PRECISION = 18

type OwnProps = {
  header?: React.Node,
  footer?: React.Node,
  searching: boolean,
  searchText: string,
  activateSearch: () => void,
  sortOptions: SortOption,
  showSlidingTutorial?: boolean
}

type StateProps = {
  activeWalletIds: string[],
  customTokens: CustomTokenInfo[],
  exchangeRates: { [string]: number },
  showBalance: boolean,
  settings: Object,
  wallets: { [walletId: string]: GuiWallet }
}

type DispatchProps = {
  selectWallet(walletId: string, currencyCode: string): void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class WalletListComponent extends React.PureComponent<Props> {
  getWalletList(activeWalletIds: string[], wallets: { [walletId: string]: GuiWallet }): WalletListItem[] {
    const { searching, searchText } = this.props
    const walletList = []

    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]
      if (wallet == null && !searching) {
        walletList.push({
          id: walletId,
          key: walletId
        })
      } else if (wallet != null) {
        const { enabledTokens } = wallet
        const { customTokens } = this.props

        if (searchText === '' || checkFilterWallet(wallet, searchText)) {
          walletList.push({
            id: walletId,
            fullCurrencyCode: wallet.currencyCode,
            key: `${walletId}-${wallet.currencyCode}`
          })
        }

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

        for (const currencyCode of enabledNotHiddenTokens) {
          const fullCurrencyCode = `${wallet.currencyCode}-${currencyCode}`
          if (searchText === '' || checkFilterToken(wallet, currencyCode, searchText)) {
            walletList.push({
              id: walletId,
              fullCurrencyCode: fullCurrencyCode,
              key: `${walletId}-${fullCurrencyCode}`
            })
          }
        }
      }
    }
    return walletList
  }

  getCryptoAmount(balance: string, denomination: EdgeDenomination, isToken: boolean): string {
    const { showBalance } = this.props
    if (isToken) {
      const cryptoAmount = formatNumber(convertNativeToDisplay(denomination.multiplier)(balance) || '0') // check if infinitesimal (would display as zero), cut off trailing zeroes
      return showBalance ? cryptoAmount : ''
    } else {
      const preliminaryCryptoAmount = truncateDecimals(bns.div(balance, denomination.multiplier, DIVIDE_PRECISION), 6)
      const finalCryptoAmount = formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
      return showBalance ? `${denomination.symbol || ''} ${finalCryptoAmount}` : ''
    }
  }

  renderRow = (data: FlatListItem<WalletListItem>, rowMap: { [string]: SwipeRow }) => {
    const { exchangeRates, settings, showBalance, showSlidingTutorial, theme, wallets } = this.props
    const walletId = data.item.id.replace(/:.*/, '')
    const guiWallet = wallets[walletId]

    if (guiWallet == null || !data.item.fullCurrencyCode) {
      return <WalletListEmptyRow rowKey={data.item.key} rowMap={rowMap} walletId={walletId} />
    } else {
      const isToken = guiWallet.currencyCode !== data.item.fullCurrencyCode
      const walletCodesArray = data.item.fullCurrencyCode.split('-')
      const currencyCode = isToken ? walletCodesArray[1] : walletCodesArray[0]
      const balance = isToken ? guiWallet.nativeBalances[currencyCode] : guiWallet.primaryNativeBalance

      const walletFiatSymbol = getFiatSymbol(guiWallet.isoFiatCurrencyCode)

      // Crypto Amount And Exchange Rate
      const denomination = getDenomination(currencyCode, settings)
      const cryptoAmount = this.getCryptoAmount(balance || '0', denomination, isToken)
      const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
      const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : null

      // Fiat Balance
      const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
      const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : '0'
      const fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
      const fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''

      // Currency Exhange Rate
      const exchangeRateFormat = exchangeRate ? formatNumber(exchangeRate, { toFixed: 2 }) : null
      const exchangeRateFiatSymbol = exchangeRateFormat ? `${walletFiatSymbol} ` : ''
      const exchangeRateString = exchangeRateFormat ? `${exchangeRateFormat}` : ''

      // Yesterdays Percentage Difference
      const yesterdayUsdExchangeRate = exchangeRates[`${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`]
      const fiatExchangeRate = guiWallet.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${guiWallet.isoFiatCurrencyCode}`] : 1
      const yesterdayExchangeRate = yesterdayUsdExchangeRate * fiatExchangeRate
      const differenceYesterday = exchangeRate ? exchangeRate - yesterdayExchangeRate : null

      let differencePercentage = differenceYesterday ? (differenceYesterday / yesterdayExchangeRate) * 100 : null
      if (!yesterdayExchangeRate) {
        differencePercentage = ''
      }

      let differencePercentageString = ''
      let differencePercentageStringStyle = theme.secondaryText
      if (!exchangeRate || !differencePercentage || isNaN(differencePercentage)) {
        differencePercentageString = ''
      } else if (exchangeRate && differencePercentage && differencePercentage === 0) {
        differencePercentageString = '0.00%'
      } else if (exchangeRate && differencePercentage && differencePercentage < 0) {
        differencePercentageStringStyle = theme.negativeText
        differencePercentageString = `-${Math.abs(differencePercentage).toFixed(2)}%`
      } else if (exchangeRate && differencePercentage && differencePercentage > 0) {
        differencePercentageStringStyle = theme.positiveText
        differencePercentageString = `+${Math.abs(differencePercentage).toFixed(2)}%`
      }

      let symbolImage
      if (isToken) {
        const meta = guiWallet.metaTokens.find(token => token.currencyCode === currencyCode)
        symbolImage = meta ? meta.symbolImage : undefined
      } else {
        symbolImage = guiWallet.symbolImageDarkMono
      }

      return (
        <WalletListRow
          cryptoAmount={cryptoAmount}
          currencyCode={currencyCode}
          differencePercentage={differencePercentageString}
          differencePercentageStyle={differencePercentageStringStyle}
          exchangeRate={exchangeRateString}
          exchangeRateFiatSymbol={exchangeRateFiatSymbol}
          fiatBalance={fiatBalanceString}
          fiatBalanceSymbol={fiatBalanceSymbol}
          isToken={isToken}
          publicAddress={guiWallet.receiveAddress.publicAddress}
          selectWallet={this.props.selectWallet}
          symbolImage={symbolImage}
          openRowLeft={data.index === 0 && showSlidingTutorial}
          walletId={walletId}
          walletName={guiWallet.name}
          swipeRow={rowMap[data.item.key]}
        />
      )
    }
  }

  render() {
    const { activeWalletIds, footer, header, searching, wallets } = this.props
    const walletList = this.getWalletList(activeWalletIds, wallets)
    return (
      <SwipeListView
        data={walletList}
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        renderItem={this.renderRow}
        refreshControl={<RefreshControl refreshing={false} onRefresh={this.props.activateSearch} />}
        contentOffset={{ y: !searching ? this.props.theme.rem(4.5) : 0 }}
        useFlatList
      />
    )
  }
}

export const WalletList = connect(
  (state: RootState): StateProps => {
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
      wallets: state.ui.wallets.byId
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    selectWallet(walletId: string, currencyCode) {
      dispatch(selectWallet(walletId, currencyCode, WALLET_LIST_SCENE))
    }
  })
)(withTheme(WalletListComponent))
