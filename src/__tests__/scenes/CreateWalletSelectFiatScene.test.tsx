import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CreateWalletSelectFiatScene } from '../../components/scenes/CreateWalletSelectFiatScene'
import { RouteProp } from '../../types/routerTypes'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('CreateWalletSelectFiatComponent', () => {
  const nonce = fakeNonce(0)
  const mockState: FakeState = {
    ui: {
      settings: {
        defaultIsoFiat: 'USD'
      }
    },
    core: {
      account: {
        currencyConfig: {
          bitcoin: {
            currencyInfo: {
              currencyCode: 'BTC'
            }
          },
          ethereum: {
            currencyInfo: {
              currencyCode: 'ETH'
            },
            builtinTokens: {
              '9992ec3cf6a55b00978cddf2b27bc6882d88d1ec': {
                currencyCode: 'POLY'
              }
            }
          }
        },
        currencyWallets: {
          'bNBAI/Z4YE1h6qk1p28jhjGJwMiARqvZPfnAt6LyxkA=': {
            name: 'My Ether',
            currencyInfo: {
              pluginId: 'ethereum'
            }
          }
        }
      }
    }
  }

  it('should render with loading props', () => {
    const navigation = fakeNavigation
    const route: RouteProp<'createWalletSelectFiat'> = {
      key: `createWalletSelectFiat-${nonce()}`,
      name: 'createWalletSelectFiat',
      params: {
        createWalletList: [
          {
            key: 'create-wallet:bitcoin-bip44-bitcoin',
            currencyCode: 'BTC',
            displayName: 'Bitcoin (no Segwit)',
            pluginId: 'bitcoin',
            walletType: 'wallet:bitcoin-bip44'
          },
          { key: 'create-wallet:ethereum-ethereum', currencyCode: 'ETH', displayName: 'Ethereum', pluginId: 'ethereum', walletType: 'wallet:ethereum' },
          {
            key: 'create-ethereum-9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
            currencyCode: 'POLY',
            displayName: 'Polymath Network',
            pluginId: 'ethereum',
            tokenId: '9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
            createWalletIds: ['bNBAI/Z4YE1h6qk1p28jhjGJwMiARqvZPfnAt6LyxkA=']
          }
        ]
      }
    }
    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <CreateWalletSelectFiatScene navigation={navigation} route={route} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
