import { EdgeCurrencyWallet } from 'edge-core-js'
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
import { EdgeAppSceneProps } from '../../../types/routerTypes'
import { getPluginFromPolicy, getPositionAllocations } from '../../../util/stakeUtils'
import { zeroString } from '../../../util/utils'
import { EdgeSwitch } from '../../buttons/EdgeSwitch'
import { EarnOptionCard } from '../../cards/EarnOptionCard'
import { EdgeAnim, fadeInUp20 } from '../../common/EdgeAnim'
import { SceneWrapper } from '../../common/SceneWrapper'
import { SectionHeader } from '../../common/SectionHeader'
import { showDevError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'

interface Props extends EdgeAppSceneProps<'earnScene'> {}

export interface EarnSceneParams {}

interface StakePolicyPosition {
  stakePolicy: StakePolicy
  stakePosition: StakePosition
}

interface StakePolicyMap {
  [walletId: string]: { stakePolicyPositions: StakePolicyPosition[]; stakePlugins: StakePlugin[] }
}

export const EarnScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallets = Object.values(currencyWallets)

  const [stakePolicyMap, setStakePolicyMap] = React.useState<StakePolicyMap>()
  const [positionWallets, setPositionWallets] = React.useState<EdgeCurrencyWallet[]>([])
  const [isPortfolioSelected, setIsPortfolioSelected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Filter wallets based on isPortfolioSelected
  const displayWallets = !stakePolicyMap ? [] : isPortfolioSelected ? positionWallets : wallets

  const handleSelectEarn = useHandler(() => setIsPortfolioSelected(false))
  const handleSelectPortfolio = useHandler(() => setIsPortfolioSelected(true))

  useAsyncEffect(
    async () => {
      if (stakePolicyMap != null) return

      const positionWallets = []
      const policyMap: StakePolicyMap = {}

      for (const wallet of wallets) {
        // Get all available stake policies
        const { pluginId } = wallet.currencyInfo
        if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true && ENV.ENABLE_STAKING) {
          // For each wallet
          const stakePolicyPositions: StakePolicyPosition[] = []

          try {
            const stakePlugins = await getStakePlugins(pluginId)
            for (const stakePlugin of stakePlugins) {
              const stakePolicies = stakePlugin.getPolicies({ wallet, currencyCode: wallet.currencyInfo.currencyCode })

              // Check if there's open positions
              for (const stakePolicy of stakePolicies) {
                const stakePosition = await stakePlugin.fetchStakePosition({ stakePolicyId: stakePolicy.stakePolicyId, wallet, account })
                stakePolicyPositions.push({ stakePolicy, stakePosition })

                const allocations = getPositionAllocations(stakePosition)
                const { staked, earned, unstaked } = allocations
                if ([...staked, ...earned, ...unstaked].some(positionAllocation => !zeroString(positionAllocation.nativeAmount))) {
                  positionWallets.push(wallet)
                }
              }
            }

            policyMap[wallet.id] = { stakePolicyPositions, stakePlugins }
            setStakePolicyMap({ ...policyMap })
            setPositionWallets(positionWallets)
          } catch (e) {
            showDevError(e)
          }
        }
      }
      setIsLoading(false)
    },
    [],
    'EarnScene'
  )

  const renderStakeItems = (wallet: EdgeCurrencyWallet) => {
    if (stakePolicyMap == null) return null

    const { stakePolicyPositions, stakePlugins } = stakePolicyMap[wallet.id] ?? { stakePolicyPositions: [], stakePlugins: [] }

    return (
      <>
        {stakePolicyPositions.map((stakePolicyPosition: { stakePolicy: StakePolicy; stakePosition: StakePosition }, index: number) => {
          const { stakePolicy, stakePosition } = stakePolicyPosition

          if (stakePolicy == null) return null
          const stakePlugin = getPluginFromPolicy(stakePlugins, stakePolicy)

          const handlePress =
            stakePlugin == null ? undefined : () => navigation.push('stakeOverview', { stakePlugin, walletId: wallet.id, stakePolicy, stakePosition })

          return (
            <EdgeAnim key={`${wallet.id}-${index}`} enter={fadeInUp20}>
              <EarnOptionCard currencyInfo={wallet.currencyInfo} stakePolicy={stakePolicy} isOpenPosition={isPortfolioSelected} onPress={handlePress} />
            </EdgeAnim>
          )
        })}
      </>
    )
  }

  return (
    // TODO: Address "VirtualizedLists should never be nested inside plain
    // ScrollViews with the same orientation because it can break windowing and
    // other functionality - use another VirtualizedList-backed container
    // instead." somehow, while retaining the bottom loader positioning...
    <SceneWrapper scroll padding={theme.rem(0.5)}>
      <EdgeSwitch labelA={lstrings.staking_discover} labelB={lstrings.staking_portfolio} onSelectA={handleSelectEarn} onSelectB={handleSelectPortfolio} />
      <SectionHeader leftTitle={lstrings.staking_earning_pools} />
      {displayWallets.map(wallet => renderStakeItems(wallet))}
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
