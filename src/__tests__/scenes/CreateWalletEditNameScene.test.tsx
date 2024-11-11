import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CreateWalletEditNameScene } from '../../components/scenes/CreateWalletEditNameScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('CreateWalletEditNameComponent', () => {
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
            },
            allTokens: {
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
        },
        watch: () => () => {}
      }
    }
  }

  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <CreateWalletEditNameScene
          {...fakeEdgeAppSceneProps('createWalletEditName', {
            createWalletList: [
              {
                type: 'create',
                key: 'create-wallet:bitcoin-bip44-bitcoin',
                currencyCode: 'BTC',
                displayName: 'Bitcoin (no Segwit)',
                pluginId: 'bitcoin',
                tokenId: null,
                walletType: 'wallet:bitcoin-bip44'
              },
              {
                type: 'create',
                key: 'create-wallet:ethereum-ethereum',
                currencyCode: 'ETH',
                displayName: 'Ethereum',
                pluginId: 'ethereum',
                tokenId: null,
                walletType: 'wallet:ethereum'
              },
              {
                type: 'create',
                key: 'create-ethereum-9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
                currencyCode: 'POLY',
                displayName: 'Polymath Network',
                pluginId: 'ethereum',
                tokenId: '9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
                createWalletIds: ['bNBAI/Z4YE1h6qk1p28jhjGJwMiARqvZPfnAt6LyxkA=']
              }
            ]
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
