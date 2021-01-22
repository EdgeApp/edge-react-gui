// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { Dimensions, Platform, RefreshControl, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view'
import { connect } from 'react-redux'

import { selectWallet } from '../../actions/WalletActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { WALLET_LIST_OPTIONS_ICON, WALLET_LIST_SCENE } from '../../constants/indexConstants'
import * as Constants from '../../constants/indexConstants'
import { formatNumber } from '../../locales/intl.js'
import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import { calculateWalletFiatBalanceUsingDefaultIsoFiat, calculateWalletFiatBalanceWithoutState, getActiveWalletIds } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, FlatListItem, GuiWallet } from '../../types/types'
import {
  alphabeticalSort,
  checkFilterWallet,
  decimalOrZero,
  getDenomination,
  getFiatSymbol,
  getYesterdayDateRoundDownHour,
  truncateDecimals
} from '../../util/utils'
import { WalletListMenuModal } from '../modals/WalletListMenuModal'
import { type SortOption } from '../modals/WalletListSortModal.js'
import { Airship } from '../services/AirshipInstance'
import type { Theme } from '../services/ThemeContext'
import { type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { HiddenMenuButtons } from './HiddenMenuButtons'
import { WalletListEmptyRow } from './WalletListEmptyRow.js'
import { WalletListRow } from './WalletListRow.js'

type WalletListItem = { id: string, fullCurrencyCode?: string, key: string }

const DIVIDE_PRECISION = 18
const FULL_WIDTH = Dimensions.get('window').width
const WIDTH_DIMENSION_HIDE = FULL_WIDTH * 0.35
const WIDTH_DIMENSION_SHOW = FULL_WIDTH * 0.15

const getSortOptionsCurrencyCode = (fullCurrencyCode: string): string => {
  const splittedCurrencyCode = fullCurrencyCode.split('-')
  return splittedCurrencyCode[1] || splittedCurrencyCode[0]
}

type OwnProps = {
  header?: React.Node,
  footer?: React.Node,
  searching: boolean,
  searchText: string,
  activateSearch: () => void,
  showSlidingTutorial?: boolean
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

type State = {
  swipeDirection: 'left' | 'right' | null,
  openingRow: SwipeRow | null
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class WalletListComponent extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      swipeDirection: null,
      openingRow: null
    }
  }

  componentDidMount(): * {
    const { showSlidingTutorial, theme } = this.props
    if (showSlidingTutorial) {
      const row: SwipeRow = Object.values(this.refs._swipeListViewRef._rows)[0]
      row.manuallySwipeRow(theme.rem(-6.25))
    }
  }

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

  getCryptoAmount(balance: string, denomination: EdgeDenomination): string {
    const { showBalance } = this.props
    const preliminaryCryptoAmount = truncateDecimals(bns.div(balance, denomination.multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    return showBalance ? `${denomination.symbol ? denomination.symbol + ' ' : ''}${finalCryptoAmount}` : ''
  }

  closeOpeningRow = () => {
    const { openingRow } = this.state
    if (openingRow) openingRow.closeRow()
  }

  handleOpenWalletListMenuModal = ({ currencyCode, isToken, symbolImage, walletId, walletName }): void => {
    this.closeOpeningRow()
    Airship.show(bridge => (
      <WalletListMenuModal bridge={bridge} walletId={walletId} walletName={walletName} currencyCode={currencyCode} image={symbolImage} isToken={isToken} />
    ))
  }

  openScene(sceneKey: string, key: string) {
    const { wallets } = this.props
    const walletId = key.split('-')[0].replace(/:.*/, '')
    const wallet = wallets[walletId]
    this.props.selectWallet(walletId, wallet.currencyCode)

    this.closeOpeningRow()

    Actions.jump(sceneKey)
  }

  onRowOpen = (rowKey: string, rowMap: { [string]: SwipeRow }) => {
    this.setState({ openingRow: rowMap[rowKey] })
  }

  handleOpenRequest = ({ key }) => {
    this.openScene(Constants.REQUEST, key)
  }

  handleOpenSend = ({ key }) => {
    this.openScene(Constants.SCAN, key)
  }

  handleSwipeValueChange = ({ value }) => {
    if ((value < WIDTH_DIMENSION_SHOW && value >= 0) || (value > -WIDTH_DIMENSION_SHOW && value <= 0)) {
      this.setState({ swipeDirection: null })
    } else if (value > WIDTH_DIMENSION_HIDE) {
      this.setState({ swipeDirection: 'right' })
    } else if (value < -WIDTH_DIMENSION_HIDE) {
      this.setState({ swipeDirection: 'left' })
    }
  }

  renderHiddenItem = (rowObj: { item: WalletListItem }, rowMap: { [string]: SwipeRow }) => {
    const { theme, wallets } = this.props
    const { swipeDirection } = this.state
    const styles = getStyles(theme)
    const isSwipingLeft = swipeDirection === 'left'
    const isSwipingRight = swipeDirection === 'right'

    const { id, key } = rowObj.item
    const walletId = id.replace(/:.*/, '')
    const { currencyCode, symbolImage, name: walletName } = wallets[walletId]
    const isToken = currencyCode !== rowObj.item.fullCurrencyCode

    return (
      <HiddenMenuButtons
        left={{
          children: (
            <View style={styles.swipeOptionsContainer}>
              <EdgeText style={styles.swipeOptionsIcon} adjustsFontSizeToFit={false}>
                {WALLET_LIST_OPTIONS_ICON}
              </EdgeText>
            </View>
          ),
          color: 'default',
          onPress: _ =>
            this.handleOpenWalletListMenuModal({
              currencyCode,
              isToken,
              symbolImage,
              walletId,
              walletName
            })
        }}
        leftSwipable={{
          children: <Fontello name="request" color={theme.icon} size={theme.rem(isSwipingRight ? 1.5 : 1)} />,
          color: 'success',
          onPress: _ => this.handleOpenRequest({ key })
        }}
        rightSwipable={{
          children: <Fontello name="send" color={theme.icon} size={theme.rem(isSwipingLeft ? 1.5 : 1)} />,
          color: 'danger',
          onPress: _ => this.handleOpenSend({ key })
        }}
        right={{
          children: (
            <View style={styles.swipeOptionsContainer}>
              <EdgeText style={styles.swipeOptionsIcon} adjustsFontSizeToFit={false}>
                {WALLET_LIST_OPTIONS_ICON}
              </EdgeText>
            </View>
          ),
          color: 'default',
          onPress: _ =>
            this.handleOpenWalletListMenuModal({
              currencyCode,
              isToken,
              symbolImage,
              walletId,
              walletName
            })
        }}
        isSwipingRight={isSwipingRight}
        isSwipingLeft={isSwipingLeft}
        swipeDirection={swipeDirection}
      />
    )
  }

  renderRow = (data: FlatListItem<WalletListItem>, rowMap: { [string]: SwipeRow }) => {
    const { exchangeRates, settings, showBalance, theme, wallets } = this.props
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
      const cryptoAmount = this.getCryptoAmount(balance || '0', denomination)
      const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
      const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : null

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
          handleOpenWalletListMenuModal={this.handleOpenWalletListMenuModal}
          symbolImage={symbolImage}
          walletId={walletId}
          walletName={guiWallet.name}
        />
      )
    }
  }

  render() {
    const { activeWalletIds, footer, header, searching, theme, wallets } = this.props
    const { swipeDirection } = this.state
    const walletList = this.getWalletList(activeWalletIds, wallets)

    const isSwipingLeft = swipeDirection === 'left'
    const isSwipingRight = swipeDirection === 'right'
    const leftOpenValue = isSwipingRight ? FULL_WIDTH : theme.rem(6.25)
    const rightOpenValue = isSwipingLeft ? -FULL_WIDTH : theme.rem(-6.25)
    const swipeToOpenPercent = isSwipingLeft || isSwipingRight ? 0 : 50
    return (
      <SwipeListView
        data={walletList}
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        renderItem={this.renderRow}
        renderHiddenItem={this.renderHiddenItem}
        refreshControl={<RefreshControl refreshing={false} onRefresh={this.props.activateSearch} tintColor={theme.searchListRefreshControlIndicator} />}
        contentOffset={{ y: !searching ? this.props.theme.rem(4.5) : 0 }}
        keyboardShouldPersistTaps="handled"
        useFlatList
        onSwipeValueChange={this.handleSwipeValueChange}
        leftOpenValue={leftOpenValue}
        rightOpenValue={rightOpenValue}
        swipeToOpenPercent={swipeToOpenPercent}
        leftActivationValue={FULL_WIDTH}
        rightActivationValue={-FULL_WIDTH}
        onRowOpen={this.onRowOpen}
        onLeftActionStatusChange={this.handleOpenRequest}
        onRightActionStatusChange={this.handleOpenSend}
        ref="_swipeListViewRef"
      />
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  swipeOptionsContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(3.125),
    paddingBottom: Platform.OS === 'ios' ? theme.rem(0.75) : theme.rem(1), // As the swipe options icon behaves like a text. This padding ensures the icon is centered vertically
    backgroundColor: theme.sliderTabMore
  },
  swipeOptionsIcon: {
    fontSize: theme.rem(1.25)
  }
}))

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
