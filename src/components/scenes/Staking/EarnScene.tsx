import { useIsFocused } from '@react-navigation/native'
import { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../../env'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import { lstrings } from '../../../locales/strings'
import { getStakePlugins } from '../../../plugins/stake-plugins/stakePlugins'
import { StakePlugin, StakePolicy, StakePosition } from '../../../plugins/stake-plugins/types'
import { FooterRender } from '../../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../../state/SceneScrollState'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../../types/routerTypes'
import { getPositionAllocations } from '../../../util/stakeUtils'
import { zeroString } from '../../../util/utils'
import { EdgeSwitch } from '../../buttons/EdgeSwitch'
import { EarnOptionCard } from '../../cards/EarnOptionCard'
import { EdgeAnim, fadeInUp20 } from '../../common/EdgeAnim'
import { SceneWrapper } from '../../common/SceneWrapper'
import { SectionHeader } from '../../common/SectionHeader'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { Airship, showDevError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { SearchFooter } from '../../themed/SearchFooter'

interface Props extends EdgeAppSceneProps<'earnScene'> {}

export interface EarnSceneParams {}

let USERNAME: string | undefined
let DISCOVER_MAP: DiscoverStakeMap = {}
let PORTFOLIO_MAP: PortfolioStakeMap = {}

interface DiscoverStakeInfo {
  stakePlugin: StakePlugin
  stakePolicy: StakePolicy
}

interface PortfolioStakeInfo extends DiscoverStakeInfo {
  walletStakeInfos: WalletStakeInfo[]
}

interface DiscoverStakeMap {
  [stakePolicyId: string]: DiscoverStakeInfo
}

interface PortfolioStakeMap {
  [stakePolicyId: string]: PortfolioStakeInfo
}

interface WalletStakeInfo {
  wallet: EdgeCurrencyWallet
  stakePosition: StakePosition
}

/** Hook to ensure the UI updates on map changes, while retaining cached data
 * functionality */
const useStakeMaps = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  const updateMaps = React.useCallback((updates: () => void) => {
    updates()
    forceUpdate()
  }, [])

  return {
    discoverMap: DISCOVER_MAP,
    portfolioMap: PORTFOLIO_MAP,
    updateMaps
  }
}

export const EarnScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const { discoverMap, portfolioMap, updateMaps } = useStakeMaps()

  const account = useSelector(state => state.core.account)
  if (USERNAME !== account.username) {
    // Reset local variable if user changes
    USERNAME = account.username
    DISCOVER_MAP = {}
    PORTFOLIO_MAP = {}
  }

  const currencyConfigMap = useSelector(state => state.core.account.currencyConfig)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallets = Object.values(currencyWallets)

  const [isPortfolioSelected, setIsPortfolioSelected] = React.useState(false)
  const [isLoadingDiscover, setIsLoadingDiscover] = React.useState(true)
  const [isLoadingPortfolio, setIsLoadingPortfolio] = React.useState(true)
  const [isPrevFocused, setIsPrevFocused] = React.useState<boolean>()

  const [searchText, setSearchText] = React.useState<string>('')
  const [isSearching, setIsSearching] = React.useState<boolean>(false)
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  const handleSelectEarn = useHandler(() => setIsPortfolioSelected(false))
  const handleSelectPortfolio = useHandler(() => setIsPortfolioSelected(true))

  const handleStartSearching = useHandler(() => {
    setIsSearching(true)
  })

  const handleDoneSearching = useHandler(() => {
    setSearchText('')
    setIsSearching(false)
  })

  const handleChangeText = useHandler((value: string) => {
    setSearchText(value)
  })

  const handleFooterLayoutHeight = useHandler((height: number) => {
    setFooterHeight(height)
  })

  const isFocused = useIsFocused()

  useAsyncEffect(
    async () => {
      const pluginIds = Object.keys(currencyConfigMap)

      for (const pluginId of pluginIds) {
        setIsLoadingDiscover(true)

        const isStakingSupported = SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true && ENV.ENABLE_STAKING
        if (!isStakingSupported) continue

        const stakePlugins = await getStakePlugins(pluginId)

        updateMaps(() => {
          for (const stakePlugin of stakePlugins) {
            for (const stakePolicy of stakePlugin.getPolicies({ pluginId }).filter(stakePolicy => !stakePolicy.deprecated)) {
              DISCOVER_MAP[stakePolicy.stakePolicyId] = {
                stakePlugin,
                stakePolicy
              }
            }
          }
        })

        setIsLoadingDiscover(false)
      }

      setIsLoadingDiscover(false)
      return () => {}
    },
    [],
    'EarnScene Initialize Discover Items'
  )

  // Refresh stake positions when re-entering the scene or on initial load
  useAsyncEffect(
    async () => {
      if (!isLoadingDiscover || (isFocused && !isPrevFocused)) {
        setIsLoadingPortfolio(true)

        const controller = new AbortController()
        const signal = controller.signal

        try {
          const stakePolicyIds = Object.keys(discoverMap)
          for (const stakePolicyId of stakePolicyIds) {
            if (signal.aborted) break

            const discoverInfo = discoverMap[stakePolicyId]
            const { stakePlugin, stakePolicy } = discoverInfo

            // Find matching wallets based on the first stake asset's pluginId
            const pluginId = stakePolicy.stakeAssets[0].pluginId
            const matchingWallets = wallets.filter((wallet: EdgeCurrencyWallet) => wallet.currencyInfo.pluginId === pluginId)

            const walletStakeInfoPromises = matchingWallets.map(async wallet => {
              if (signal.aborted) return null
              try {
                const stakePosition = await stakePlugin.fetchStakePosition({
                  stakePolicyId: stakePolicy.stakePolicyId,
                  wallet,
                  account
                })
                const allocations = getPositionAllocations(stakePosition)
                const { staked, earned, unstaked } = allocations
                const isPositionOpen = [...staked, ...earned, ...unstaked].some(positionAllocation => !zeroString(positionAllocation.nativeAmount))

                if (isPositionOpen) {
                  return { wallet, stakePosition }
                }
              } catch (e) {
                showDevError(e)
              }
              return null
            })

            if (!signal.aborted) {
              const walletStakeInfos = (await Promise.all(walletStakeInfoPromises)).filter(
                (info: WalletStakeInfo | null): info is WalletStakeInfo => info != null
              )

              updateMaps(() => {
                PORTFOLIO_MAP[stakePolicyId] = {
                  ...discoverInfo,
                  walletStakeInfos
                }
              })
            }
          }
        } finally {
          if (!signal.aborted) {
            setIsLoadingPortfolio(false)
            setIsPrevFocused(isFocused)
          }
        }

        return () => {
          controller.abort()
        }
      }
    },
    [isFocused, isLoadingDiscover, updateMaps],
    'EarnScene Refresh Portfolio Data'
  )

  const filterStakeInfo = (info: DiscoverStakeInfo | PortfolioStakeInfo): boolean => {
    if (!searchText) return true
    const searchLower = searchText.toLowerCase()

    // Match against policy provider name
    if (info.stakePolicy.stakeProviderInfo.displayName.toLowerCase().includes(searchLower)) return true

    // Match against stake assets
    for (const stakeAsset of info.stakePolicy.stakeAssets) {
      const currencyInfo = currencyConfigMap[stakeAsset.pluginId].currencyInfo
      if (currencyInfo.displayName.toLowerCase().includes(searchLower)) return true
      if (currencyInfo.currencyCode.toLowerCase().includes(searchLower)) return true
      // Also check asset's own display name if available
      if (stakeAsset.displayName?.toLowerCase().includes(searchLower)) return true
      if (stakeAsset.currencyCode?.toLowerCase().includes(searchLower)) return true
    }

    // Match against reward assets
    for (const rewardAsset of info.stakePolicy.rewardAssets) {
      const currencyInfo = currencyConfigMap[rewardAsset.pluginId].currencyInfo
      if (currencyInfo.displayName.toLowerCase().includes(searchLower)) return true
      if (currencyInfo.currencyCode.toLowerCase().includes(searchLower)) return true
      // Also check asset's own display name if available
      if (rewardAsset.displayName?.toLowerCase().includes(searchLower)) return true
      if (rewardAsset.currencyCode?.toLowerCase().includes(searchLower)) return true
    }

    return false
  }

  const renderDiscoverItem = React.useCallback(
    (discoverStakeInfo: DiscoverStakeInfo, currencyInfo: EdgeCurrencyInfo) => {
      const { stakePlugin, stakePolicy } = discoverStakeInfo

      const handlePress = async () => {
        let walletId: string | undefined

        const matchingWallets = wallets.filter((wallet: EdgeCurrencyWallet) => wallet.currencyInfo.pluginId === currencyInfo.pluginId)
        if (matchingWallets.length === 1) {
          // Only one compatible wallet, auto-select it
          const wallet = matchingWallets[0]
          walletId = wallet.id
        } else {
          // Select an existing wallet that matches this policy or create a new one
          const allowedAssets = stakePolicy.stakeAssets.map(stakeAsset => ({
            pluginId: stakeAsset.pluginId,
            tokenId: null
          }))

          const result = await Airship.show<WalletListResult>(bridge => (
            <WalletListModal
              bridge={bridge}
              allowedAssets={allowedAssets}
              headerTitle={lstrings.select_wallet}
              showCreateWallet
              navigation={navigation as NavigationBase}
            />
          ))

          if (result?.type === 'wallet') {
            walletId = result.walletId
          }
        }

        // User backed out of the WalletListModal
        if (walletId == null) return

        dispatch({ type: 'STAKING/ADD_POLICY', walletId, stakePolicy })

        navigation.push('stakeOverview', {
          walletId,
          stakePlugin,
          stakePolicyId: stakePolicy.stakePolicyId
        })
      }

      return (
        <EdgeAnim key={stakePolicy.stakePolicyId} enter={fadeInUp20}>
          <EarnOptionCard currencyInfo={currencyInfo} stakePolicy={stakePolicy} isOpenPosition={false} onPress={handlePress} />
        </EdgeAnim>
      )
    },
    [dispatch, navigation, wallets]
  )

  const renderPortfolioItem = React.useCallback(
    (portfolioStakeInfo: PortfolioStakeInfo, currencyInfo: EdgeCurrencyInfo) => {
      const { stakePlugin, stakePolicy, walletStakeInfos } = portfolioStakeInfo
      if (walletStakeInfos.length === 0) return null

      const handlePress = async () => {
        let walletId: string | undefined
        let stakePosition: StakePosition | undefined

        const matchingWallets = wallets.filter((wallet: EdgeCurrencyWallet) => wallet.currencyInfo.pluginId === currencyInfo.pluginId)
        if (matchingWallets.length === 1) {
          // Only one wallet with an open position, auto-select it
          const { wallet, stakePosition: existingStakePosition } = walletStakeInfos[0]
          walletId = wallet.id
          stakePosition = existingStakePosition
        } else {
          // Select from wallets that have an open position
          const allowedWalletIds = walletStakeInfos.map(walletStakePosition => walletStakePosition.wallet.id)

          const result = await Airship.show<WalletListResult>(bridge => (
            <WalletListModal
              bridge={bridge}
              allowedWalletIds={allowedWalletIds}
              headerTitle={lstrings.select_wallet}
              showCreateWallet={false}
              navigation={navigation as NavigationBase}
            />
          ))

          if (result?.type === 'wallet') {
            walletId = result.walletId
            stakePosition = walletStakeInfos.find(walletStakeInfo => walletStakeInfo.wallet.id === result.walletId)?.stakePosition
          }
        }

        // User backed out of the WalletListModal
        if (walletId == null || stakePosition == null) return

        dispatch({ type: 'STAKING/UPDATE', walletId, stakePolicy, stakePosition })

        navigation.push('stakeOverview', {
          walletId,
          stakePlugin,
          stakePolicyId: stakePolicy.stakePolicyId
        })
      }

      return (
        <EdgeAnim key={stakePolicy.stakePolicyId} enter={fadeInUp20}>
          <EarnOptionCard currencyInfo={currencyInfo} stakePolicy={stakePolicy} isOpenPosition onPress={handlePress} />
        </EdgeAnim>
      )
    },
    [dispatch, navigation, wallets]
  )

  const renderFooter: FooterRender = React.useCallback(
    sceneWrapperInfo => {
      return (
        <SearchFooter
          name="EarnScene-SearchFooter"
          placeholder={lstrings.earn_search}
          isSearching={isSearching}
          searchText={searchText}
          sceneWrapperInfo={sceneWrapperInfo}
          onStartSearching={handleStartSearching}
          onDoneSearching={handleDoneSearching}
          onChangeText={handleChangeText}
          onLayoutHeight={handleFooterLayoutHeight}
        />
      )
    },
    [handleChangeText, handleDoneSearching, handleFooterLayoutHeight, handleStartSearching, isSearching, searchText]
  )

  const filteredPortfolioItems = React.useMemo(() => {
    const items: Array<PortfolioStakeInfo | null> = Object.values(portfolioMap).filter(filterStakeInfo)
    if (isLoadingPortfolio) items.push(null)
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioMap, filterStakeInfo, searchText, isLoadingPortfolio])

  const filteredDiscoverItems = React.useMemo(() => {
    const items: Array<DiscoverStakeInfo | null> = Object.values(discoverMap).filter(filterStakeInfo)
    if (isLoadingDiscover) items.push(null)
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverMap, filterStakeInfo, searchText, isLoadingDiscover])

  const renderItem = React.useCallback(
    (info: ListRenderItemInfo<DiscoverStakeInfo | PortfolioStakeInfo | null>) => {
      if (info.item === null) {
        return <ActivityIndicator style={styles.loader} size="large" color={theme.primaryText} />
      }
      const currencyInfo = currencyConfigMap[info.item.stakePolicy.stakeAssets[0].pluginId].currencyInfo
      return isPortfolioSelected
        ? renderPortfolioItem(info.item as PortfolioStakeInfo, currencyInfo)
        : renderDiscoverItem(info.item as DiscoverStakeInfo, currencyInfo)
    },
    [currencyConfigMap, isPortfolioSelected, renderPortfolioItem, renderDiscoverItem, styles.loader, theme.primaryText]
  )

  const handleScroll = useSceneScrollHandler()

  return (
    <SceneWrapper avoidKeyboard renderFooter={renderFooter} footerHeight={footerHeight}>
      {({ insetStyle, undoInsetStyle }) => (
        <>
          <EdgeSwitch labelA={lstrings.staking_discover} labelB={lstrings.staking_portfolio} onSelectA={handleSelectEarn} onSelectB={handleSelectPortfolio} />
          <SectionHeader leftTitle={lstrings.staking_earning_pools} />
          <View style={{ ...undoInsetStyle, marginTop: 0 }}>
            <Animated.FlatList
              contentContainerStyle={{ ...insetStyle, ...styles.list }}
              data={isPortfolioSelected ? filteredPortfolioItems : filteredDiscoverItems}
              keyExtractor={(item, index) => item?.stakePolicy.stakePolicyId ?? `loader-${index}`}
              onScroll={handleScroll}
              renderItem={renderItem}
              scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
            />
          </View>
        </>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  loader: {
    marginTop: theme.rem(2),
    marginBottom: theme.rem(3)
  },
  list: {
    paddingTop: 0,
    marginHorizontal: theme.rem(0.5)
  }
}))
