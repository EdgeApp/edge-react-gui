import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CreateWalletSelectCryptoRow } from '../../components/themed/CreateWalletSelectCryptoRow'
import { rootReducer } from '../../reducers/RootReducer'

describe('WalletListRow', () => {
  const mockState: any = {
    core: {
      account: {
        currencyConfig: {
          bitcoin: {
            currencyInfo: {
              currencyCode: 'BTC',
              pluginId: 'bitcoin'
            }
          }
        }
      }
    }
  }
  const store = createStore(rootReducer, mockState)

  it('should render with loading props', () => {
    const pluginId = 'bitcoin'
    const walletName = 'My bitcoin wallet'
    const onPress = () => undefined
    const rightSide = <IonIcon size={26} color="#66EDA8" name="chevron-forward-outline" />

    const renderer = TestRenderer.create(
      <Provider store={store}>
        <CreateWalletSelectCryptoRow pluginId={pluginId} walletName={walletName} onPress={onPress} rightSide={rightSide} />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
