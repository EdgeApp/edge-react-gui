import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Feather from 'react-native-vector-icons/Feather'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import {
  createWallet,
  getUniqueWalletName
} from '../../actions/CreateWalletActions'
import { updateStakingState } from '../../actions/scene/StakingActions'
import { Fontello } from '../../assets/vector/index'
import {
  WalletListModal,
  WalletListResult
} from '../../components/modals/WalletListModal'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { toLocaleDate, toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getStakePlugins } from '../../plugins/stake-plugins/stakePlugins'
import {
  filterStakePolicies,
  StakePolicy
} from '../../plugins/stake-plugins/types'
import { defaultWalletStakingState } from '../../reducers/StakingReducer'
import {
  getCoingeckoFiat,
  getDefaultFiat
} from '../../selectors/SettingsSelectors'
import {
  asCoinRankingData,
  CoinRankingData,
  CoinRankingDataPercentChange
} from '../../types/coinrankTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { CryptoAmount } from '../../util/CryptoAmount'
import { fetchRates } from '../../util/network'
import { getBestApyText, isStakingSupported } from '../../util/stakeUtils'
import { getUkCompliantString } from '../../util/ukComplianceUtils'
import { formatLargeNumberString as formatLargeNumber } from '../../util/utils'
import { IconButton } from '../buttons/IconButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { SwipeChart } from '../charts/SwipeChart'
import { EdgeAnim, fadeInDown, fadeInLeft } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type CoinRankingDataValueType =
  | string
  | number
  | CoinRankingDataPercentChange
  | undefined

export interface CoinRankingDetailsParams {
  assetId: string
  coinRankingData?: CoinRankingData
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

const PERCENT_CHANGE_DATA_KEYS: string[] = [
  'hours1',
  'hours24',
  'days7',
  'days30',
  'year1'
]

const COLUMN_LEFT_DATA_KEYS: Array<keyof CoinRankingData> = [
  'price',
  'priceChange24h',
  'percentChange',
  'high24h',
  'low24h'
]

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
  const { assetId, coinRankingData: initCoinRankingData } = route.params

  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const walletStakingStateMap = useSelector(
    state => state.staking.walletStakingMap ?? defaultWalletStakingState
  )
  const countryCode = useSelector(state => state.ui.countryCode)

  const currencyConfigMap = useWatch(account, 'currencyConfig')
  const currencyWallets = useWatch(account, 'currencyWallets')

  // In case the user changes their default fiat while viewing this scene, we
  // want to go back since the parent scene handles fetching data.
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const coingeckoFiat = useSelector(state => getCoingeckoFiat(state))

  const hideNonUkCompliantFeat = countryCode === 'GB'

  const [fetchedCoinRankingData] = useAsyncValue(async () => {
    if (assetId == null) {
      throw new Error('No currencyCode or coinRankingData provided')
    }
    const response = await fetchRates(
      `v2/coinrankAsset/${assetId}?fiatCode=iso:${coingeckoFiat}`
    )
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Unable to fetch coin ranking data. ${text}`)
    }

    const json = await response.json()
    const crData = asCoinRankingData(json.data)

    return crData
  }, [assetId, coingeckoFiat])

  const coinRankingData = fetchedCoinRankingData ?? initCoinRankingData

  const { currencyCode: coinRankingCurrencyCode, currencyName } =
    coinRankingData ?? {}
  // `coinRankingCurrencyCode` is lowercase and that breaks a lot of our utility
  // calls
  const currencyCode = coinRankingCurrencyCode?.toUpperCase() ?? ''

  /** Loosely Equivalent EdgeAssets for the CoinGecko coin on this scene */
  const matchingEdgeAssets = React.useMemo<EdgeAsset[]>(() => {
    if (coinRankingData == null) return []

    const out = []
    // Search for mainnet coins:
    for (const pluginId of Object.keys(account.currencyConfig)) {
      const config = account.currencyConfig[pluginId]
      if (
        config.currencyInfo.currencyCode.toLowerCase() ===
        currencyCode.toLowerCase()
      )
        out.push({ tokenId: null, pluginId })
    }
    // Search for tokens:
    for (const pluginId of Object.keys(account.currencyConfig)) {
      const config = account.currencyConfig[pluginId]
      for (const tokenId of Object.keys(config.allTokens)) {
        const token = config.allTokens[tokenId]
        if (token.currencyCode.toLowerCase() === currencyCode.toLowerCase())
          out.push({ tokenId, pluginId })
      }
    }
    return out
  }, [account.currencyConfig, coinRankingData, currencyCode])

  /** Find all wallets that can hold this asset */
  const matchingWallets = React.useMemo(
    () =>
      Object.values(currencyWallets).filter(wallet =>
        matchingEdgeAssets.some(
          asset => asset.pluginId === wallet.currencyInfo.pluginId
        )
      ),
    [matchingEdgeAssets, currencyWallets]
  )

  /**
   * Out of those wallets, which ones support staking, specific to the asset on
   * this scene. This is only populated once the staking state has been
   * initialized in the effect below.
   */
  const stakingWallets = matchingWallets.filter(wallet => {
    return (
      isStakingSupported(wallet.currencyInfo.pluginId) &&
      walletStakingStateMap[wallet.id] != null &&
      filterStakePolicies(
        Object.values(walletStakingStateMap[wallet.id].stakePolicies).map(
          stakePolicy => stakePolicy
        ),
        { wallet, currencyCode }
      ).length > 0
    )
  })

  React.useEffect(() => {
    // Initialize staking state
    if (coinRankingData != null && matchingWallets.length > 0) {
      // Start with a looser filter that does not include the stake policy,
      // because it has not yet been initialized
      const uninitializedStakingWallets = matchingWallets.filter(wallet =>
        isStakingSupported(wallet.currencyInfo.pluginId)
      )

      for (const wallet of uninitializedStakingWallets) {
        if (
          walletStakingStateMap[wallet.id] != null &&
          Object.keys(walletStakingStateMap[wallet.id].stakePolicies).length > 0
        )
          continue
        dispatch(updateStakingState(currencyCode, wallet)).catch(err =>
          showError(err)
        )
      }
    }
    // We don't want other dependencies to cause a flood of update requests that
    // break the staking state update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingWallets.length, coinRankingData])

  // Get all stake policies we support
  const [allStakePolicies] = useAsyncValue<StakePolicy[]>(async () => {
    const out = []
    const pluginIds = Object.keys(currencyConfigMap)
    if (currencyCode === 'FIO') {
      // FIO has special handling
      return []
    }
    for (const pluginId of pluginIds.filter(
      pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true
    )) {
      const stakePlugins = await getStakePlugins(pluginId)

      for (const stakePlugin of stakePlugins) {
        for (const stakePolicy of stakePlugin
          .getPolicies({ pluginId, currencyCode })
          .filter(stakePolicy => !stakePolicy.deprecated)) {
          out.push(stakePolicy)
        }
      }
    }

    return out
  }, [currencyCode, currencyConfigMap])

  const edgeStakingAssets = matchingEdgeAssets.filter(
    asset =>
      filterStakePolicies(allStakePolicies ?? [], {
        pluginId: asset.pluginId,
        currencyCode: currencyCode.toUpperCase()
      }).length > 0
  )

  /** True if currency supports staking, regardless of if wallets are owned */
  const isEarnShown =
    (allStakePolicies?.length ?? 0) > 0 &&
    matchingEdgeAssets.some(
      asset =>
        SPECIAL_CURRENCY_INFO[asset.pluginId]?.isStakingSupported === true
    )

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

  const parseCoinRankingData = (
    dataKey: string,
    data: CoinRankingDataValueType
  ): string => {
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
        })} ${coingeckoFiat}`
      case 'rank':
        return `#${baseString}`
      case 'marketCapChange24h':
        extendedString =
          coinRankingData?.marketCapChangePercent24h != null
            ? ` (${toPercentString(
                coinRankingData.marketCapChangePercent24h / 100
              )})`
            : ''
        break
      case 'allTimeHigh': {
        const fiatString = `${formatFiatString({
          fiatAmount: baseString
        })} ${coingeckoFiat}`
        return coinRankingData?.allTimeHighDate != null
          ? `${fiatString} - ${toLocaleDate(
              new Date(coinRankingData.allTimeHighDate)
            )}`
          : fiatString
      }
      case 'allTimeLow': {
        const fiatString = `${formatFiatString({
          fiatAmount: baseString
        })} ${coingeckoFiat}`
        return coinRankingData?.allTimeLowDate != null
          ? `${fiatString} - ${toLocaleDate(
              new Date(coinRankingData.allTimeLowDate)
            )}`
          : fiatString
      }
      default:
        // If no special modifications, just return simple data formatting
        return baseString
    }

    return `${baseString}${extendedString}`
  }

  const renderRow = (
    dataKey: string,
    data: CoinRankingDataValueType,
    index: number
  ): React.ReactElement => {
    return (
      <EdgeAnim
        style={styles.row}
        key={dataKey}
        enter={{ type: 'fadeInDown', distance: 20 * index }}
      >
        <EdgeText style={styles.rowTitle}>
          {COINRANKINGDATA_TITLE_MAP[dataKey]}
        </EdgeText>
        <EdgeText style={styles.rowBody}>
          {parseCoinRankingData(dataKey, data)}
        </EdgeText>
      </EdgeAnim>
    )
  }

  const renderRows = (
    coinRankingData: CoinRankingData | CoinRankingDataPercentChange,
    keysFilter: string[]
  ): React.ReactElement[] => {
    return renderRowsInner(coinRankingData, keysFilter, 0)
  }

  const renderRowsInner = (
    coinRankingData: CoinRankingData | CoinRankingDataPercentChange,
    keysFilter: string[],
    index: number
  ): React.ReactElement[] => {
    const rows: React.ReactElement[] = []

    keysFilter.forEach((key: string) => {
      if (
        Object.keys(coinRankingData).some(
          coinRankingDataKey => coinRankingDataKey === key
        )
      ) {
        if (key === 'percentChange') {
          rows.push(
            ...renderRowsInner(
              (coinRankingData as CoinRankingData).percentChange,
              PERCENT_CHANGE_DATA_KEYS,
              index
            )
          )
        } else {
          index++
          rows.push(
            renderRow(
              key,
              coinRankingData[
                key as keyof (CoinRankingData | CoinRankingDataPercentChange)
              ],
              index
            )
          )
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
  const chooseWalletListResult = async (
    filteredEdgeAssets: EdgeAsset[],
    filteredMatchingWallets: EdgeCurrencyWallet[],
    title: string
  ): Promise<Extract<WalletListResult, { type: 'wallet' }> | undefined> => {
    // No compatible assets. Shouldn't happen since buttons are blocked from
    // handlers anyway, if there's no filteredEdgeAssets
    if (filteredEdgeAssets.length === 0) return

    // If no wallet exists, auto create one.
    // Only do this if there is only one possible match that we know of
    if (
      filteredMatchingWallets.length === 0 &&
      filteredEdgeAssets.length === 1
    ) {
      const walletName = getUniqueWalletName(
        account,
        filteredEdgeAssets[0].pluginId
      )
      const targetWallet = await dispatch(
        createWallet(account, {
          name: walletName,
          walletType: `wallet:${filteredEdgeAssets[0].pluginId}`
        })
      )
      if (filteredEdgeAssets[0].tokenId != null) {
        await targetWallet.changeEnabledTokenIds([
          ...targetWallet.enabledTokenIds,
          filteredEdgeAssets[0].tokenId
        ])
      }
      return {
        type: 'wallet',
        tokenId: filteredEdgeAssets[0].tokenId,
        walletId: targetWallet.id
      }
    }

    // If only one wallet, auto-select it
    if (
      filteredMatchingWallets.length === 1 &&
      filteredEdgeAssets.length === 1
    ) {
      return {
        type: 'wallet',
        tokenId: filteredEdgeAssets[0].tokenId,
        walletId: filteredMatchingWallets[0].id
      }
    }

    // Else, If multiple wallets, show picker. Tokens also can be added here.
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={navigation as NavigationBase}
        headerTitle={title}
        allowedAssets={filteredEdgeAssets}
        showCreateWallet
      />
    ))
    // User aborted the flow. Callers will also noop.
    if (result?.type !== 'wallet') return
    return result
  }

  const handleBuyPress = useHandler(async () => {
    if (matchingEdgeAssets.length === 0) return
    const forcedWalletResult = await chooseWalletListResult(
      matchingEdgeAssets,
      matchingWallets,
      lstrings.fiat_plugin_select_asset_to_purchase
    )
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
    if (matchingEdgeAssets.length === 0) return
    const forcedWalletResult = await chooseWalletListResult(
      matchingEdgeAssets,
      matchingWallets,
      lstrings.fiat_plugin_select_asset_to_sell
    )
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

  const handleSwapPress = useHandler(async () => {
    if (matchingEdgeAssets.length === 0) return

    const walletListResult = await chooseWalletListResult(
      matchingEdgeAssets,
      matchingWallets,
      lstrings.select_wallet
    )
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
        }).fiatValue(exchangeRates, 'iso:USD')

        if (largestDollarValue == null || dollarValue > largestDollarValue) {
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

  const handleStakePress = useHandler(async () => {
    const walletListResult = await chooseWalletListResult(
      edgeStakingAssets,
      stakingWallets,
      lstrings.select_wallet
    )
    if (walletListResult == null) return
    const { walletId } = walletListResult

    // Handle FIO staking
    if (currencyCode === 'FIO') {
      navigation.push('fioStakingOverview', {
        tokenId: null,
        walletId
      })
    } else {
      navigation.push('stakeOptions', {
        walletId,
        currencyCode
      })
    }
  })

  return (
    <SceneWrapper hasTabs hasNotifications scroll>
      {coinRankingData != null ? (
        <View style={styles.container}>
          <EdgeAnim style={styles.titleContainer} enter={fadeInLeft}>
            <FastImage style={styles.icon} source={imageUrlObject} />
            <EdgeText
              style={styles.title}
            >{`${currencyName} (${currencyCode})`}</EdgeText>
          </EdgeAnim>
          <SwipeChart assetId={coinRankingData.assetId} />
          <EdgeAnim
            style={styles.buttonsContainer}
            visible={
              matchingEdgeAssets.length !== 0 && hideNonUkCompliantFeat != null
            }
            enter={fadeInDown}
          >
            {hideNonUkCompliantFeat ? null : (
              <>
                <IconButton label={lstrings.title_buy} onPress={handleBuyPress}>
                  <Fontello
                    name="buy"
                    size={theme.rem(2)}
                    color={theme.primaryText}
                  />
                </IconButton>
                <IconButton
                  label={lstrings.title_sell}
                  onPress={handleSellPress}
                >
                  <Fontello
                    name="sell"
                    size={theme.rem(2)}
                    color={theme.primaryText}
                  />
                </IconButton>
              </>
            )}
            {countryCode == null || !isEarnShown ? null : (
              <IconButton
                label={getUkCompliantString(
                  countryCode,
                  'stake_earn_button_label'
                )}
                superscriptLabel={
                  allStakePolicies == null
                    ? undefined
                    : getBestApyText(
                        filterStakePolicies(allStakePolicies, { currencyCode })
                      )
                }
                onPress={handleStakePress}
              >
                <Feather
                  name="percent"
                  size={theme.rem(2)}
                  color={theme.primaryText}
                />
              </IconButton>
            )}
            <IconButton label={lstrings.swap} onPress={handleSwapPress}>
              <Ionicons
                name="swap-horizontal"
                size={theme.rem(2)}
                color={theme.primaryText}
              />
            </IconButton>
          </EdgeAnim>
          {defaultFiat === coingeckoFiat ? null : (
            <AlertCardUi4
              type="warning"
              title={lstrings.coin_rank_currency_rates_warning_title}
              body={sprintf(
                lstrings.coin_rank_currency_rates_warning_message_2s,
                coingeckoFiat,
                defaultFiat
              )}
            />
          )}
          <View style={styles.columns}>
            <View style={styles.column}>
              {renderRows(coinRankingData, COLUMN_LEFT_DATA_KEYS)}
            </View>
            <View style={styles.column}>
              {renderRows(coinRankingData, COLUMN_RIGHT_DATA_KEYS)}
            </View>
          </View>
        </View>
      ) : (
        <EdgeText>{lstrings.loading}</EdgeText>
      )}
    </SceneWrapper>
  )
}

export const CoinRankingDetailsScene = React.memo(
  CoinRankingDetailsSceneComponent
)

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
