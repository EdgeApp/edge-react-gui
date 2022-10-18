import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CreateWalletSelectFiatScene } from '../../components/scenes/CreateWalletSelectFiatScene'
import { rootReducer } from '../../reducers/RootReducer'
import { RouteProp } from '../../types/routerTypes'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CreateWalletSelectFiatComponent', () => {
  const mockState: any = {
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
          'bNBAI/Z4YE1h6qk1p28jhjGJwMiARqvZPfnAt6LyxkA=': {}
        }
      }
    }
  }
  const store = createStore(rootReducer, mockState)

  it('should render with loading props', () => {
    const navigation = fakeNavigation
    const route: RouteProp<'createWalletSelectFiat'> = {
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
    const actual = renderer.create(
      <Provider store={store}>
        <CreateWalletSelectFiatScene navigation={navigation} route={route} />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
