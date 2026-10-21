import { describe, expect, it } from '@jest/globals'

import { lstrings } from '../../locales/strings'
import { tarotpool } from '../../plugins/stake-plugins/generic/pluginInfo/optimismTarotPool'
import { pluginInfo } from '../../plugins/stake-plugins/uniswapV2/pluginInfo'
import { fantomPolicyInfo } from '../../plugins/stake-plugins/uniswapV2/policyInfo/fantom'
import { optimismPolicyInfo } from '../../plugins/stake-plugins/uniswapV2/policyInfo/optimism'
import { toStakePolicy } from '../../plugins/stake-plugins/uniswapV2/stakePolicy'

const toPolicy = toStakePolicy({ policies: {} })

describe('Velodrome Earn deprecation', () => {
  it('deprecates every Optimism Velodrome policy', () => {
    expect(optimismPolicyInfo.length).toBeGreaterThan(0)
    for (const info of optimismPolicyInfo) {
      const policy = toPolicy(info)
      expect(policy.stakePolicyId).toMatch(/^optimism_velodrome_/)
      expect(policy.deprecated).toBe(true)
      expect(policy.unstakeWarning).toBe(
        lstrings.stake_warning_velodrome_aero_upgrade
      )
    }
  })

  it('leaves the Fantom policies alone', () => {
    for (const info of fantomPolicyInfo) {
      const policy = toPolicy(info)
      expect(policy.deprecated).toBeUndefined()
      expect(policy.unstakeWarning).toBeUndefined()
    }
  })

  it('registers every Velodrome policy with the uniswapV2 plugin', () => {
    const ids = pluginInfo.policyInfo.map(info => info.stakePolicyId)
    for (const info of optimismPolicyInfo) {
      expect(ids).toContain(info.stakePolicyId)
    }
  })

  it('deprecates every Tarot pool built on Velodrome LP', () => {
    expect(tarotpool.policyConfigs.length).toBeGreaterThan(0)
    for (const config of tarotpool.policyConfigs) {
      expect(config.adapterConfig.type).toBe('tarot-velodrome-pool')
      expect(config.deprecated).toBe(true)
      expect(config.unstakeWarning).toBe(
        lstrings.stake_warning_velodrome_aero_upgrade
      )
    }
  })
})
