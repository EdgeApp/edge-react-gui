import { describe, it } from '@jest/globals'
import { EdgeAccount } from 'edge-core-js'

import { fioCodeToEdgeAsset } from '../../constants/FioConstants'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'

const fakeCurrencyConfig: EdgeAccount['currencyConfig'] = {
  // We don't want L2's stealing the "ETH" currencyCode:
  arbitrum: makeFakeCurrencyConfig({
    pluginId: 'arbitrum',
    currencyCode: 'ETH'
  }),

  // A normal token on normal chain:
  ethereum: makeFakeCurrencyConfig(
    {
      pluginId: 'ethereum',
      currencyCode: 'ETH'
    },
    {
      dac17f958d2ee523a2206206994597c13d831ec7: {
        currencyCode: 'USDT',
        displayName: 'USDT',
        denominations: [],
        networkLocation: {}
      }
    }
  ),

  // This chain has a different name in FIO land:
  bobevm: makeFakeCurrencyConfig({
    pluginId: 'bobevm',
    currencyCode: 'ETH'
  }),

  // XRP has renamed tokens:
  ripple: makeFakeCurrencyConfig(
    {
      pluginId: 'ripple',
      currencyCode: 'XRP'
    },
    {
      'USD-rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq': {
        currencyCode: 'USD.gh',
        displayName: 'Gatehub USD',
        denominations: [],
        networkLocation: {}
      }
    }
  )
}

const fakeAccount: EdgeAccount = { currencyConfig: fakeCurrencyConfig } as any

describe('fioCodeToEdgeAsset', () => {
  it('Should find normal currencies', async () => {
    expect(fioCodeToEdgeAsset(fakeAccount, 'ETH', 'ETH')).toStrictEqual({
      pluginId: 'ethereum',
      tokenId: null
    })

    expect(fioCodeToEdgeAsset(fakeAccount, 'ETH', 'USDT')).toStrictEqual({
      pluginId: 'ethereum',
      tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7'
    })
  })

  it('Should find renamed currencies', async () => {
    expect(
      fioCodeToEdgeAsset(fakeAccount, 'BOBNETWORK', 'BOBNETWORK')
    ).toStrictEqual({ pluginId: 'bobevm', tokenId: null })

    expect(fioCodeToEdgeAsset(fakeAccount, 'XRP', 'USDGH')).toStrictEqual({
      pluginId: 'ripple',
      tokenId: 'USD-rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
    })
  })

  it('Should reject missing currencies', async () => {
    expect(fioCodeToEdgeAsset(fakeAccount, 'ETH', 'FOO')).toStrictEqual(
      undefined
    )

    expect(fioCodeToEdgeAsset(fakeAccount, 'FOO', 'FOO')).toStrictEqual(
      undefined
    )
  })
})
