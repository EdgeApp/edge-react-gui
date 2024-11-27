import { useIsFocused } from '@react-navigation/native'
import { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../../env'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import { lstrings } from '../../../locales/strings'
import { getStakePlugins } from '../../../plugins/stake-plugins/stakePlugins'
import { StakePlugin, StakePolicy, StakePosition } from '../../../plugins/stake-plugins/types'
import { useSelector } from '../../../types/reactRedux'
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

  const handleSelectEarn = useHandler(() => setIsPortfolioSelected(false))
  const handleSelectPortfolio = useHandler(() => setIsPortfolioSelected(true))

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

        console.debug('getStakePlugins', pluginId, 'complete')
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

  const renderDiscoverItem = (discoverStakeInfo: DiscoverStakeInfo, currencyInfo: EdgeCurrencyInfo) => {
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
        const allowedAssets = stakePolicy.stakeAssets.map(stakeAsset => ({ pluginId: stakeAsset.pluginId, tokenId: null }))

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

      navigation.push('stakeOverview', {
        walletId,
        stakePlugin,
        stakePolicy,
        // 'stakeOverview' scene will fetch the position if one exists.
        // No need to know if a position exists at this point.
        stakePosition: undefined
      })
    }

    return (
      <EdgeAnim key={stakePolicy.stakePolicyId} enter={fadeInUp20}>
        <EarnOptionCard currencyInfo={currencyInfo} stakePolicy={stakePolicy} isOpenPosition={false} onPress={handlePress} />
      </EdgeAnim>
    )
  }

  const renderPortfolioItem = (portfolioStakeInfo: PortfolioStakeInfo, currencyInfo: EdgeCurrencyInfo) => {
    const { stakePlugin, stakePolicy, walletStakeInfos } = portfolioStakeInfo
    if (walletStakeInfos.length === 0) return null

    const handlePress = async () => {
      let walletId: string | undefined
      let stakePosition

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
      if (walletId == null) return

      navigation.push('stakeOverview', {
        walletId,
        stakePlugin,
        stakePolicy,
        stakePosition
      })
    }

    return (
      <EdgeAnim key={stakePolicy.stakePolicyId} enter={fadeInUp20}>
        <EarnOptionCard currencyInfo={currencyInfo} stakePolicy={stakePolicy} isOpenPosition onPress={handlePress} />
      </EdgeAnim>
    )
  }

  return (
    <SceneWrapper scroll padding={theme.rem(0.5)}>
      <EdgeSwitch labelA={lstrings.staking_discover} labelB={lstrings.staking_portfolio} onSelectA={handleSelectEarn} onSelectB={handleSelectPortfolio} />
      <SectionHeader leftTitle={lstrings.staking_earning_pools} />
      {isPortfolioSelected &&
        Object.values(portfolioMap).map(info => renderPortfolioItem(info, currencyConfigMap[info.stakePolicy.stakeAssets[0].pluginId].currencyInfo))}
      {!isPortfolioSelected &&
        Object.values(discoverMap).map(info => renderDiscoverItem(info, currencyConfigMap[info.stakePolicy.stakeAssets[0].pluginId].currencyInfo))}
      {((isLoadingDiscover && !isPortfolioSelected) || (isLoadingPortfolio && isPortfolioSelected)) && (
        <ActivityIndicator style={styles.loader} size="large" color={theme.primaryText} />
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
    marginBottom: theme.rem(1)
  }
}))
