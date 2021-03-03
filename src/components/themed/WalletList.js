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
import { calculateWalletFiatBalanceUsingDefaultIsoFiat, calculateWalletFiatBalanceWithoutState, getActiveWalletIds } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, FlatListItem, GuiWallet } from '../../types/types.js'
import {
  alphabeticalSort,
  checkFilterWallet,
  decimalOrZero,
  getDenomFromIsoCode,
  getDenomination,
  getFiatSymbol,
  getYesterdayDateRoundDownHour,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  truncateDecimals
} from '../../util/utils'
import { type SortOption } from '../modals/WalletListSortModal.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { WalletListEmptyRow } from './WalletListEmptyRow.js'
import { WalletListRow } from './WalletListRow.js'

type WalletListItem = { id: string, fullCurrencyCode?: string, key: string }

const DIVIDE_PRECISION = 18

const getSortOptionsCurrencyCode = (fullCurrencyCode: string): string => {
  const splittedCurrencyCode = fullCurrencyCode.split('-')
  return splittedCurrencyCode[1] || splittedCurrencyCode[0]
}

type OwnProps = {
  header?: React.Node,
  footer?: React.Node,
  searching: boolean,
  searchText: string,
  activateSearch?: () => void,
  showSlidingTutorial?: boolean,
  isModal?: boolean,
  onPress?: (walletId: string, currencyCode: string) => void
}

type StateProps = {
  activeWalletIds: string[],
  customTokens: CustomTokenInfo[],
  exchangeRates: { [string]: number },
  showBalance: boolean,
  settings: Object,
  walletsSort: SortOption,
  wallets: { [walletId: string]: GuiWallet }
}

type DispatchProps = {
  selectWallet(walletId: string, currencyCode: string): void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class WalletListComponent extends React.PureComponent<Props> {
  sortWalletList(walletList: WalletListItem[]) {
    const getFiatBalance = (wallet: GuiWallet, fullCurrencyCode: string) => {
      const { settings, exchangeRates } = this.props
      const currencyCode = getSortOptionsCurrencyCode(fullCurrencyCode)
      return calculateWalletFiatBalanceUsingDefaultIsoFiat(wallet, currencyCode, settings, exchangeRates)
    }

    if (this.props.walletsSort === 'name') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        return alphabeticalSort(wallets[itemA.id].name, wallets[itemB.id].name)
      })
    }

    if (this.props.walletsSort === 'currencyCode') {
      walletList.sort((itemA, itemB) => {
        return alphabeticalSort(getSortOptionsCurrencyCode(itemA.fullCurrencyCode || ''), getSortOptionsCurrencyCode(itemB.fullCurrencyCode || ''))
      })
    }

    if (this.props.walletsSort === 'currencyName') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        const currencyNameA = wallets[itemA.id].currencyNames[getSortOptionsCurrencyCode(itemA.fullCurrencyCode || '')]
        const currencyNameB = wallets[itemB.id].currencyNames[getSortOptionsCurrencyCode(itemB.fullCurrencyCode || '')]
        return alphabeticalSort(currencyNameA, currencyNameB)
      })
    }

    if (this.props.walletsSort === 'highest') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        return getFiatBalance(wallets[itemB.id], itemB.fullCurrencyCode || '') - getFiatBalance(wallets[itemA.id], itemA.fullCurrencyCode || '')
      })
    }

    if (this.props.walletsSort === 'lowest') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        return getFiatBalance(wallets[itemA.id], itemA.fullCurrencyCode || '') - getFiatBalance(wallets[itemB.id], itemB.fullCurrencyCode || '')
      })
    }
    return walletList
  }

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

        if (searchText === '' || checkFilterWallet(wallet, wallet.currencyCode, searchText)) {
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
          const customTokenInfo = wallet.currencyNames[currencyCode] ? undefined : customTokens.find(token => token.currencyCode === currencyCode)
          if (searchText === '' || checkFilterWallet(wallet, currencyCode, searchText, customTokenInfo)) {
            walletList.push({
              id: walletId,
              fullCurrencyCode: fullCurrencyCode,
              key: `${walletId}-${fullCurrencyCode}`
            })
          }
        }
      }
    }

    return this.sortWalletList(walletList)
  }

  getCryptoAmount(
    balance: string,
    denomination: EdgeDenomination,
    exchangeDenomination: EdgeDenomination,
    fiatDenomination: EdgeDenomination,
    exchangeRate?: number,
    guiWallet: GuiWallet
  ): string {
    const { showBalance } = this.props
    let maxConversionDecimals = 6
    if (exchangeRate) {
      const precisionAdjustValue = precisionAdjust({
        primaryExchangeMultiplier: exchangeDenomination.multiplier,
        secondaryExchangeMultiplier: fiatDenomination.multiplier,
        exchangeSecondaryToPrimaryRatio: exchangeRate
      })
      maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(bns.log10(denomination.multiplier), precisionAdjustValue)
    }
    try {
      const preliminaryCryptoAmount = truncateDecimals(bns.div(balance, denomination.multiplier, DIVIDE_PRECISION), maxConversionDecimals)
      const finalCryptoAmount = formatNumber(decimalOrZero(preliminaryCryptoAmount, maxConversionDecimals)) // check if infinitesimal (would display as zero), cut off trailing zeroes
      return showBalance ? `${denomination.symbol ? denomination.symbol + ' ' : ''}${finalCryptoAmount}` : ''
    } catch (error) {
      if (error.message === 'Cannot operate on base16 float values') {
        const errorMessage = `${error.message}: GuiWallet currency code - ${guiWallet.currencyCode}, balance - ${balance}, demonination multiplier: ${denomination.multiplier}`
        throw new Error(errorMessage)
      }
      throw new Error(error)
    }
  }

  renderRow = (data: FlatListItem<WalletListItem>, rowMap: { [string]: SwipeRow }) => {
    const { exchangeRates, isModal, onPress, settings, showBalance, showSlidingTutorial, theme, wallets } = this.props
    const walletId = data.item.id.replace(/:.*/, '')
    const guiWallet = wallets[walletId]

    if (guiWallet == null || !data.item.fullCurrencyCode) {
      return <WalletListEmptyRow walletId={walletId} swipeRow={rowMap[data.item.key]} />
    } else {
      const isToken = guiWallet.currencyCode !== data.item.fullCurrencyCode
      const walletCodesArray = data.item.fullCurrencyCode.split('-')
      const currencyCode = isToken ? walletCodesArray[1] : walletCodesArray[0]
      const balance = isToken ? guiWallet.nativeBalances[currencyCode] : guiWallet.primaryNativeBalance

      const walletFiatSymbol = getFiatSymbol(guiWallet.isoFiatCurrencyCode)

      // Crypto Amount And Exchange Rate
      const denomination = getDenomination(currencyCode, settings, 'display')
      const exchangeDenomination = getDenomination(currencyCode, settings, 'exchange')
      const fiatDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
      const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
      const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : undefined
      const cryptoAmount = showBalance
        ? balance && balance !== '0'
          ? this.getCryptoAmount(balance, denomination, exchangeDenomination, fiatDenomination, exchangeRate, guiWallet)
          : '0'
        : ''

      // Fiat Balance
      const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
      const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : '0'
      const fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
      const fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''

      // Currency Exhange Rate
      const exchangeRateFormat = exchangeRate ? formatNumber(exchangeRate, { toFixed: exchangeRate && Math.log10(exchangeRate) >= 3 ? 0 : 2 }) : null
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
        differencePercentageString = `-${Math.abs(differencePercentage).toFixed(1)}%`
      } else if (exchangeRate && differencePercentage && differencePercentage > 0) {
        differencePercentageStringStyle = theme.positiveText
        differencePercentageString = `+${Math.abs(differencePercentage).toFixed(1)}%`
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
          isModal={isModal}
          onPress={onPress}
        />
      )
    }
  }

  render() {
    const { activeWalletIds, footer, header, isModal, searching, theme, wallets } = this.props
    const walletList = this.getWalletList(activeWalletIds, wallets)
    return (
      <SwipeListView
        data={walletList}
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        renderItem={this.renderRow}
        refreshControl={
          !isModal ? <RefreshControl refreshing={false} onRefresh={this.props.activateSearch} tintColor={theme.searchListRefreshControlIndicator} /> : undefined
        }
        contentOffset={{ y: !searching && !isModal ? this.props.theme.rem(4.5) : 0 }}
        keyboardShouldPersistTaps="handled"
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
      walletsSort: state.ui.settings.walletsSort,
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
