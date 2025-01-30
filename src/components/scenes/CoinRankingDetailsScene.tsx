import { useIsFocused } from '@react-navigation/native'
import { gt } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Feather from 'react-native-vector-icons/Feather'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { createWallet, getUniqueWalletName } from '../../actions/CreateWalletActions'
import { getFirstOpenInfo } from '../../actions/FirstOpenActions'
import { updateStakingState } from '../../actions/scene/StakingActions'
import { Fontello } from '../../assets/vector/index'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { toLocaleDate, toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { defaultWalletStakingState } from '../../reducers/StakingReducer'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { asCoinRankingData, CoinRankingData, CoinRankingDataPercentChange } from '../../types/coinrankTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { CryptoAmount } from '../../util/CryptoAmount'
import { fetchRates } from '../../util/network'
import { getPluginFromPolicy } from '../../util/stakeUtils'
import { getUkCompliantString } from '../../util/ukComplianceUtils'
import { DECIMAL_PRECISION, formatLargeNumberString as formatLargeNumber } from '../../util/utils'
import { IconButton } from '../buttons/IconButton'
import { SwipeChart } from '../charts/SwipeChart'
import { EdgeAnim, fadeInLeft } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { COINGECKO_SUPPORTED_FIATS } from './CoinRankingScene'

type CoinRankingDataValueType = string | number | CoinRankingDataPercentChange | undefined

export interface CoinRankingDetailsParams {
  assetId?: string
  coinRankingData?: CoinRankingData
  fiatCurrencyCode: string
}

interface Props extends EdgeAppSceneProps<'coinRankingDetails'> {}

const COINRANKINGDATA_TITLE_MAP: { [key: string]: string } = {
  currencyCode: '',
  currencyName: '',
  imageUrl: '',
  marketCap: lstrings.coin_rank_title_market_cap,
  percentChange: '', // Display the children of this field instead

  // Keys of percentChange
  hours1: lstrings.coin_rank_title_hours_1,
  hours24: lstrings.coin_rank_title_hours_24,
  days7: lstrings.coin_rank_title_days_7,
  days30: lstrings.coin_rank_title_days_30,
  year1: lstrings.coin_rank_title_year_1,

  price: lstrings.coin_rank_price,
  rank: lstrings.coin_rank_rank,
  volume24h: lstrings.coin_rank_title_volume_24h,
  high24h: lstrings.coin_rank_title_high_24h,
  low24h: lstrings.coin_rank_title_low_24h,
  priceChange24h: lstrings.coin_rank_title_price_change_24h,
  priceChangePercent24h: '', // Duplicate of percentChange children
  marketCapChange24h: lstrings.coin_rank_title_market_cap_change_24h,
  marketCapChangePercent24h: '', // Appended to marketCapChange24h
  circulatingSupply: lstrings.coin_rank_title_circulating_supply,
  totalSupply: lstrings.coin_rank_title_total_supply,
  maxSupply: lstrings.coin_rank_title_max_supply,
  allTimeHigh: lstrings.coin_rank_title_all_time_high,
  allTimeHighDate: '', // Appended to allTimeHigh
  allTimeLow: lstrings.coin_rank_title_all_time_low,
  allTimeLowDate: '' // Appended to allTimeLow
}

const PERCENT_CHANGE_DATA_KEYS: string[] = ['hours1', 'hours24', 'days7', 'days30', 'year1']

const COLUMN_LEFT_DATA_KEYS: Array<keyof CoinRankingData> = ['price', 'priceChange24h', 'percentChange', 'high24h', 'low24h']

const COLUMN_RIGHT_DATA_KEYS: Array<keyof CoinRankingData> = [
  'rank',
  'volume24h',
  'marketCap',
  'marketCapChange24h',
  'totalSupply',
  'circulatingSupply',
  'maxSupply',
  'allTimeHigh',
  'allTimeLow'
]

const CoinRankingDetailsSceneComponent = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()
  const { route, navigation } = props
  const { assetId, fiatCurrencyCode, coinRankingData: initCoinRankingData } = route.params

  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const walletStakingStateMap = useSelector(state => state.staking.walletStakingMap ?? defaultWalletStakingState)

  const currencyWallets = useWatch(account, 'currencyWallets')
  const isFocused = useIsFocused()

  const [countryCode] = useAsyncValue(async () => (await getFirstOpenInfo()).countryCode)

  // In case the user changes their default fiat while viewing this scene, we
  // want to go back since the parent scene handles fetching data.
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const supportedFiat = COINGECKO_SUPPORTED_FIATS[defaultFiat as keyof typeof COINGECKO_SUPPORTED_FIATS] != null ? defaultFiat : 'USD'
  const [fetchedCoinRankingData] = useAsyncValue(async () => {
    if (assetId == null) {
      throw new Error('No currencyCode or coinRankingData provided')
    }
    const response = await fetchRates(`v2/coinrankAsset/${assetId}?fiatCode=iso:${supportedFiat}`)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Unable to fetch coin ranking data. ${text}`)
    }

    const json = await response.json()
    const crData = asCoinRankingData(json.data)

    return crData
  }, [assetId, supportedFiat])

  const coinRankingData = fetchedCoinRankingData ?? initCoinRankingData

  const { currencyCode: coinRankingCurrencyCode, currencyName } = coinRankingData ?? {}
  // `coinRankingCurrencyCode` is lowercase and that breaks a lot of our utility
  // calls
  const currencyCode = coinRankingCurrencyCode?.toUpperCase() ?? ''

  /** Loosely Equivalent EdgeAssets for the CoinGecko coin on this scene */
  const edgeAssets = React.useMemo<EdgeAsset[]>(() => {
    if (coinRankingData == null) return []

    const out = []
    // Search for mainnet coins:
    for (const pluginId of Object.keys(account.currencyConfig)) {
      const config = account.currencyConfig[pluginId]
      if (config.currencyInfo.currencyCode.toLowerCase() === currencyCode.toLowerCase()) out.push({ tokenId: null, pluginId })
    }
    // Search for tokens:
    for (const pluginId of Object.keys(account.currencyConfig)) {
      const config = account.currencyConfig[pluginId]
      for (const tokenId of Object.keys(config.allTokens)) {
        const token = config.allTokens[tokenId]
        if (token.currencyCode.toLowerCase() === currencyCode.toLowerCase()) out.push({ tokenId, pluginId })
      }
    }
    return out
  }, [account.currencyConfig, coinRankingData, currencyCode])

  const initFiat = React.useState<string>(fiatCurrencyCode)[0]

  /** Find all wallets that can hold this asset */
  const matchingWallets = React.useMemo(
    () => Object.values(currencyWallets).filter(wallet => edgeAssets.some(asset => asset.pluginId === wallet.currencyInfo.pluginId)),
    [edgeAssets, currencyWallets]
  )

  /** Check if all the stake plugins are loaded for this asset type */
  const isStakingLoading = matchingWallets.some(wallet => walletStakingStateMap[wallet.id] == null || walletStakingStateMap[wallet.id].isLoading)

  React.useEffect(() => {
    if (isFocused && initFiat !== supportedFiat) {
      // Take this stale scene off the stack
      navigation.pop()
      // Force a refresh & refetch
      navigation.navigate('coinRanking')

      // Update staking state:
      if (coinRankingData != null && matchingWallets.length > 0) {
        matchingWallets.forEach(wallet => {
          dispatch(updateStakingState(currencyCode, wallet)).catch(err => showError(err))
        })
      }
    }
  }, [coinRankingData, currencyCode, dispatch, edgeAssets, initFiat, isFocused, matchingWallets, navigation, supportedFiat])

  const imageUrlObject = React.useMemo(
    () => ({
      uri: coinRankingData?.imageUrl ?? ''
    }),
    [coinRankingData]
  )

  const formatData = (data: CoinRankingDataValueType): string => {
    if (typeof data === 'number') {
      return formatLargeNumber(data)
    } else if (typeof data === 'string') {
      return data
    } else {
      return 'N/A'
    }
  }

  const parseCoinRankingData = (dataKey: string, data: CoinRankingDataValueType): string => {
    // Start with either a plain number string, truncated large number string,
    // or some other alphanumeric string
    const baseString = formatData(data)
    let extendedString

    switch (dataKey) {
      case 'hours1':
      case 'hours24':
      case 'days7':
      case 'days30':
      case 'year1':
        return data == null ? 'N/A' : toPercentString(Number(data) / 100)
      case 'price':
      case 'priceChange24h':
      case 'high24h':
      case 'low24h':
      case 'volume24h':
      case 'marketCap':
        return `${formatFiatString({
          fiatAmount: baseString
        })} ${supportedFiat}`
      case 'rank':
        return `#${baseString}`
      case 'marketCapChange24h':
        extendedString = coinRankingData?.marketCapChangePercent24h != null ? ` (${toPercentString(coinRankingData.marketCapChangePercent24h / 100)})` : ''
        break
      case 'allTimeHigh': {
        const fiatString = `${formatFiatString({
          fiatAmount: baseString
        })} ${supportedFiat}`
        return coinRankingData?.allTimeHighDate != null ? `${fiatString} - ${toLocaleDate(new Date(coinRankingData.allTimeHighDate))}` : fiatString
      }
      case 'allTimeLow': {
        const fiatString = `${formatFiatString({
          fiatAmount: baseString
        })} ${supportedFiat}`
        return coinRankingData?.allTimeLowDate != null ? `${fiatString} - ${toLocaleDate(new Date(coinRankingData.allTimeLowDate))}` : fiatString
      }
      default:
        // If no special modifications, just return simple data formatting
        return baseString
    }

    return `${baseString}${extendedString}`
  }

  const renderRow = (dataKey: string, data: CoinRankingDataValueType, index: number): JSX.Element => {
    return (
      <EdgeAnim style={styles.row} key={dataKey} enter={{ type: 'fadeInDown', distance: 20 * index }}>
        <EdgeText style={styles.rowTitle}>{COINRANKINGDATA_TITLE_MAP[dataKey]}</EdgeText>
        <EdgeText style={styles.rowBody}>{parseCoinRankingData(dataKey, data)}</EdgeText>
      </EdgeAnim>
    )
  }

  const renderRows = (coinRankingData: CoinRankingData | CoinRankingDataPercentChange, keysFilter: string[]): JSX.Element[] => {
    return renderRowsInner(coinRankingData, keysFilter, 0)
  }

  const renderRowsInner = (coinRankingData: CoinRankingData | CoinRankingDataPercentChange, keysFilter: string[], index: number): JSX.Element[] => {
    const rows: JSX.Element[] = []

    keysFilter.forEach((key: string) => {
      if (Object.keys(coinRankingData).some(coinRankingDataKey => coinRankingDataKey === key)) {
        if (key === 'percentChange') {
          rows.push(...renderRowsInner((coinRankingData as CoinRankingData).percentChange, PERCENT_CHANGE_DATA_KEYS, index))
        } else {
          index++
          rows.push(renderRow(key, coinRankingData[key as keyof (CoinRankingData | CoinRankingDataPercentChange)], index))
        }
      }
    })

    return rows
  }

  /**
   * Returns a WalletListResult to use for the button navigation. Returns the
   * wallet the user chose from the wallet picker, automatically selects a
   * single wallet, or undefined if the user was presented with the wallet
   * picker but dismissed it.
   */
  const chooseWalletListResult = async (): Promise<Extract<WalletListResult, { type: 'wallet' }> | undefined> => {
    // No compatible assets. Shouldn't happen since buttons are blocked from
    // handlers anyway, if there's no edgeAssets
    if (edgeAssets.length === 0) return

    // If no wallet exists, auto create one.
    // Only do this if there is only one possible match that we know of
    if (matchingWallets.length === 0 && edgeAssets.length === 1) {
      const walletName = getUniqueWalletName(account, edgeAssets[0].pluginId)
      const targetWallet = await createWallet(account, {
        name: walletName,
        walletType: `wallet:${edgeAssets[0].pluginId}`,
        fiatCurrencyCode: fiatCurrencyCode
      })
      if (edgeAssets[0].tokenId != null) {
        await targetWallet.changeEnabledTokenIds([...targetWallet.enabledTokenIds, edgeAssets[0].tokenId])
      }
      return {
        type: 'wallet',
        tokenId: edgeAssets[0].tokenId,
        walletId: targetWallet.id
      }
    }

    // If only one wallet, auto-select it
    if (matchingWallets.length === 1) {
      return {
        type: 'wallet',
        tokenId: edgeAssets[0].tokenId,
        walletId: matchingWallets[0].id
      }
    }

    // Else, If multiple wallets, show picker. Tokens also can be added here.
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={navigation as NavigationBase}
        headerTitle={lstrings.select_wallet_to_send_from}
        allowedAssets={edgeAssets}
        showCreateWallet
      />
    ))
    // User aborted the flow. Callers will also noop.
    if (result?.type !== 'wallet') return
    return result
  }

  const handleBuyPress = useHandler(async () => {
    if (edgeAssets.length === 0) return
    const forcedWalletResult = await chooseWalletListResult()
    if (forcedWalletResult == null) return

    navigation.navigate('edgeTabs', {
      screen: 'buyTab',
      params: {
        screen: 'pluginListBuy',
        params: {
          forcedWalletResult
        }
      }
    })
  })

  const handleSellPress = useHandler(async () => {
    if (edgeAssets.length === 0) return
    const forcedWalletResult = await chooseWalletListResult()
    if (forcedWalletResult == null) return

    navigation.navigate('edgeTabs', {
      screen: 'sellTab',
      params: {
        screen: 'pluginListSell',
        params: {
          forcedWalletResult
        }
      }
    })
  })

  const handleTradePress = useHandler(async () => {
    if (edgeAssets.length === 0) return

    const walletListResult = await chooseWalletListResult()
    if (walletListResult == null) return

    const { walletId, tokenId } = walletListResult

    // Find the wallet/token with highest USD value to use as source (swap from)
    let largestDollarValue
    let sourceWallet
    let sourceTokenId = null
    for (const wallet of Object.values(currencyWallets)) {
      // Get the highest CryptoAmount from the balanceMap and record the
      // tokenId:
      for (const balanceTokenId of wallet.balanceMap.keys()) {
        if (balanceTokenId === tokenId && wallet.id === walletId) continue

        const dollarValue = new CryptoAmount({
          currencyConfig: wallet.currencyConfig,
          tokenId: balanceTokenId,
          nativeAmount: wallet.balanceMap.get(balanceTokenId) ?? '0'
        }).displayDollarValue(exchangeRates, DECIMAL_PRECISION)

        if (largestDollarValue == null || gt(dollarValue, largestDollarValue)) {
          sourceWallet = wallet
          sourceTokenId = balanceTokenId
          largestDollarValue = dollarValue
        }
      }
    }

    // Navigate to the swap scene
    navigation.navigate('edgeTabs', {
      screen: 'swapTab',
      params: {
        screen: 'swapCreate',
        params: {
          fromWalletId: sourceWallet?.id,
          fromTokenId: sourceTokenId,
          toWalletId: walletId,
          toTokenId: tokenId
        }
      }
    })
  })

  const isStakingAvailable = (): boolean => {
    if (countryCode == null || edgeAssets.length === 0) return false

    // Special case for FIO because it uses it's own staking plugin
    const isStakingSupported = currencyCode === 'FIO' || edgeAssets.some(asset => SPECIAL_CURRENCY_INFO[asset.pluginId]?.isStakingSupported === true)
    return isStakingSupported
  }

  const handleStakePress = useHandler(async () => {
    const walletListResult = await chooseWalletListResult()
    if (walletListResult == null) return
    const { walletId } = walletListResult

    const walletStakingState = walletStakingStateMap[walletId] ?? defaultWalletStakingState
    const { stakePlugins } = walletStakingState
    const stakePolicies = Object.values(walletStakingState.stakePolicies)

    // Handle FIO staking
    if (currencyCode === 'FIO') {
      navigation.push('fioStakingOverview', {
        tokenId: null,
        walletId
      })
      return
    }

    // Handle StakePlugin staking
    if (stakePlugins != null && stakePolicies != null) {
      if (stakePolicies.length > 1) {
        navigation.push('stakeOptions', {
          walletId,
          currencyCode
        })
      } else if (stakePolicies.length === 1) {
        const [stakePolicy] = stakePolicies
        const { stakePolicyId } = stakePolicy
        const stakePlugin = getPluginFromPolicy(stakePlugins, stakePolicy, {
          pluginId: currencyWallets[walletId].currencyInfo.pluginId,
          currencyCode
        })
        if (stakePlugin != null)
          navigation.push('stakeOverview', {
            stakePlugin,
            walletId,
            stakePolicyId
          })
      }
    }
  })

  return (
    <SceneWrapper hasTabs hasNotifications scroll>
      {coinRankingData != null ? (
        <View style={styles.container}>
          <EdgeAnim style={styles.titleContainer} enter={fadeInLeft}>
            <FastImage style={styles.icon} source={imageUrlObject} />
            <EdgeText style={styles.title}>{`${currencyName} (${currencyCode})`}</EdgeText>
          </EdgeAnim>
          <SwipeChart assetId={coinRankingData.assetId} currencyCode={currencyCode} fiatCurrencyCode={initFiat} />
          {edgeAssets.length <= 0 ? null : (
            <View style={styles.buttonsContainer}>
              <IconButton label={lstrings.title_buy} onPress={handleBuyPress}>
                <Fontello name="buy" size={theme.rem(2)} color={theme.primaryText} />
              </IconButton>
              <IconButton label={lstrings.title_sell} onPress={handleSellPress}>
                <Fontello name="sell" size={theme.rem(2)} color={theme.primaryText} />
              </IconButton>
              {!isStakingAvailable() ? null : (
                <IconButton label={getUkCompliantString(countryCode, 'stake_earn_button_label')} onPress={handleStakePress}>
                  {isStakingLoading ? (
                    <ActivityIndicator color={theme.primaryText} style={styles.buttonLoader} />
                  ) : (
                    <Feather name="percent" size={theme.rem(2)} color={theme.primaryText} />
                  )}
                </IconButton>
              )}
              <IconButton label={lstrings.trade_currency} onPress={handleTradePress}>
                <Ionicons name="swap-horizontal" size={theme.rem(2)} color={theme.primaryText} />
              </IconButton>
            </View>
          )}
          <View style={styles.columns}>
            <View style={styles.column}>{renderRows(coinRankingData, COLUMN_LEFT_DATA_KEYS)}</View>
            <View style={styles.column}>{renderRows(coinRankingData, COLUMN_RIGHT_DATA_KEYS)}</View>
          </View>
        </View>
      ) : (
        <EdgeText>{lstrings.loading}</EdgeText>
      )}
    </SceneWrapper>
  )
}

export const CoinRankingDetailsScene = React.memo(CoinRankingDetailsSceneComponent)

const getStyles = cacheStyles((theme: Theme) => {
  return {
    container: {
      padding: theme.rem(0.5)
    },
    column: {
      alignItems: 'flex-start',
      width: '50%'
    },
    columns: {
      flex: 1,
      flexDirection: 'row'
    },
    icon: {
      width: theme.rem(1.5),
      height: theme.rem(1.5)
    },
    row: {
      margin: theme.rem(0.5),
      justifyContent: 'center'
    },
    rowBody: {
      fontSize: theme.rem(0.75)
    },
    rowTitle: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75)
    },
    title: {
      fontFamily: theme.fontFaceBold,
      marginLeft: theme.rem(0.5)
    },
    titleContainer: {
      margin: theme.rem(0.5),
      flexDirection: 'row',
      alignItems: 'center'
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginVertical: theme.rem(1),
      paddingHorizontal: theme.rem(1)
    },
    buttonLoader: {
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: theme.rem(2)
    }
  }
})
