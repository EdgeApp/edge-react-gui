import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import { getStakePlugins } from '../../plugins/stake-plugins/stakePlugins'
import type { StakePlugin } from '../../plugins/stake-plugins/types'
import type {
  StakePolicyMap,
  StakePositionMap
} from '../../reducers/StakingReducer'
import type { ThunkAction } from '../../types/reduxTypes'
import { datelog } from '../../util/utils'

export const updateStakingState = (
  tokenId: EdgeTokenId,
  wallet: EdgeCurrencyWallet
): ThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const walletId = wallet.id

    const state = getState()
    const account = state.core.account
    const { pluginId } = wallet.currencyInfo

    // Exit with empty state if staking is not supported
    if (
      SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported !== true ||
      !ENV.ENABLE_STAKING
    ) {
      dispatch({ type: 'STAKING/FINISH_LOADING', walletId })
      return
    }

    const stakePlugins = await getStakePlugins(pluginId)
    const stakePolicyMap: StakePolicyMap = {}

    const stakePositionMap: StakePositionMap = {}
    for (const stakePlugin of stakePlugins) {
      const stakePolicies = stakePlugin.getPolicies({
        pluginId,
        wallet,
        tokenId
      })
      for (const stakePolicy of stakePolicies) {
        stakePolicyMap[stakePolicy.stakePolicyId] = stakePolicy
        try {
          const stakePosition = await stakePlugin.fetchStakePosition({
            stakePolicyId: stakePolicy.stakePolicyId,
            wallet,
            account
          })

          stakePositionMap[stakePolicy.stakePolicyId] = stakePosition
        } catch (err) {
          console.error(err)
          const { displayName } = stakePolicy.stakeProviderInfo
          datelog(`${displayName}: ${lstrings.stake_unable_to_query_locked}`)
          continue
        }
      }
    }

    dispatch({
      type: 'STAKING/SETUP',
      walletId,
      stakePolicies: stakePolicyMap,
      stakePositionMap
    })
  }
}

export const updateStakingPosition = (
  stakePlugin: StakePlugin,
  stakePolicyId: string,
  wallet: EdgeCurrencyWallet,
  account: EdgeAccount
): ThunkAction<Promise<void>> => {
  return async dispatch => {
    const stakePosition = await stakePlugin.fetchStakePosition({
      stakePolicyId,
      wallet,
      account
    })
    dispatch({
      type: 'STAKING/UPDATE_POSITION',
      walletId: wallet.id,
      stakePolicyId,
      stakePosition
    })
  }
}
