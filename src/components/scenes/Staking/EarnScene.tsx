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

interface WalletStakeInfo {
  wallet: EdgeCurrencyWallet
  isPositionOpen: boolean
  stakePosition: StakePosition
}

interface DisplayStakeInfo {
  stakePlugin: StakePlugin
  stakePolicy: StakePolicy
  walletStakeInfos: WalletStakeInfo[]
}

interface StakePolicyMap {
  [pluginId: string]: DisplayStakeInfo[]
}

export const EarnScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  const currencyConfigMap = useSelector(state => state.core.account.currencyConfig)

  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallets = Object.values(currencyWallets)

  const [isPortfolioSelected, setIsPortfolioSelected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Store `stakePolicyMap` in a ref and manage re-renders manually to avoid
  // re-initializing it every time we enter the scene.
  const [updateCounter, setUpdateCounter] = React.useState(0)
  const stakePolicyMapRef = React.useRef<StakePolicyMap>({})
  const stakePolicyMap = stakePolicyMapRef.current

  const handleSelectEarn = useHandler(() => setIsPortfolioSelected(false))
  const handleSelectPortfolio = useHandler(() => setIsPortfolioSelected(true))

  useAsyncEffect(
    async () => {
      for (const pluginId of Object.keys(currencyConfigMap)) {
        const isStakingSupported = SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true && ENV.ENABLE_STAKING
        if (stakePolicyMap[pluginId] != null || !isStakingSupported) continue

        // Initialize stake policy
        try {
          const stakePlugins = await getStakePlugins(pluginId)
          stakePolicyMap[pluginId] = []

          for (const stakePlugin of stakePlugins) {
            const stakePolicies = stakePlugin.getPolicies({ pluginId })
            const matchingWallets = wallets.filter((wallet: EdgeCurrencyWallet) => wallet.currencyInfo.pluginId === pluginId)

            for (const stakePolicy of stakePolicies) {
              const walletStakePositions = []
              for (const wallet of matchingWallets) {
                // Determine if a wallet matching this policy has an open position
                const stakePosition = await stakePlugin.fetchStakePosition({ stakePolicyId: stakePolicy.stakePolicyId, wallet, account })
                const allocations = getPositionAllocations(stakePosition)
                const { staked, earned, unstaked } = allocations
                const isPositionOpen = [...staked, ...earned, ...unstaked].some(positionAllocation => !zeroString(positionAllocation.nativeAmount))

                walletStakePositions.push({ wallet, isPositionOpen, stakePosition })
              }

              stakePolicyMap[pluginId].push({
                stakePlugin,
                stakePolicy,
                walletStakeInfos: walletStakePositions
              })
              // Trigger re-render
              setUpdateCounter(prevCounter => prevCounter + 1)
            }
          }
        } catch (e) {
          showDevError(e)
        }
      }
      setIsLoading(false)
    },
    [updateCounter],
    'EarnScene'
  )

  const renderStakeItems = (displayStakeInfo: DisplayStakeInfo, currencyInfo: EdgeCurrencyInfo) => {
    const { stakePlugin, stakePolicy, walletStakeInfos } = displayStakeInfo

    const handlePress = async () => {
      let walletId: string | undefined
      let stakePosition

      const openStakePositions = walletStakeInfos.filter(walletStakeInfo => walletStakeInfo.isPositionOpen)

      if (walletStakeInfos.length === 1 || (isPortfolioSelected && openStakePositions.length === 1)) {
        // Only one compatible wallet if on "Discover", or only one open
        // position on "Portfolio." Auto-select the wallet.
        const { wallet, stakePosition: existingStakePosition } = walletStakeInfos[0]

        walletId = wallet.id
        stakePosition = existingStakePosition
      } else {
        // Select an existing wallet that matches this policy or create a new one
        const allowedAssets = stakePolicy.stakeAssets.map(stakeAsset => ({ pluginId: stakeAsset.pluginId, tokenId: null }))

        // Filter for wallets that have an open position if "Portfolio" is
        // selected
        const allowedWalletIds = isPortfolioSelected
          ? walletStakeInfos.filter(walletStakeInfo => walletStakeInfo.isPositionOpen).map(walletStakePosition => walletStakePosition.wallet.id)
          : undefined

        const result = await Airship.show<WalletListResult>(bridge => (
          <WalletListModal
            bridge={bridge}
            allowedAssets={allowedAssets}
            allowedWalletIds={allowedWalletIds}
            headerTitle={lstrings.select_wallet}
            // Only allow wallet creation on the Discover tab
            showCreateWallet={isPortfolioSelected}
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
        <EarnOptionCard currencyInfo={currencyInfo} stakePolicy={stakePolicy} isOpenPosition={isPortfolioSelected} onPress={handlePress} />
      </EdgeAnim>
    )
  }

  return (
    <SceneWrapper scroll padding={theme.rem(0.5)}>
      <EdgeSwitch labelA={lstrings.staking_discover} labelB={lstrings.staking_portfolio} onSelectA={handleSelectEarn} onSelectB={handleSelectPortfolio} />
      <SectionHeader leftTitle={lstrings.staking_earning_pools} />
      {Object.keys(stakePolicyMap).map(pluginId =>
        stakePolicyMap[pluginId].map(displayStakeInfo => renderStakeItems(displayStakeInfo, currencyConfigMap[pluginId].currencyInfo))
      )}
      {isLoading && <ActivityIndicator style={styles.loader} size="large" color={theme.primaryText} />}
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
