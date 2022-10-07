import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { Provider } from 'react-redux'
import { createRenderer } from 'react-test-renderer/shallow'
import { createStore } from 'redux'

import { CreateWalletSelectCryptoRow } from '../../components/themed/CreateWalletSelectCryptoRow'
import { rootReducer } from '../../reducers/RootReducer'

describe('WalletListRow', () => {
  const mockState: any = {
    core: {
      account: {
        currencyConfigs: {
          bitcoin: {
            pluginId: 'bitcoin'
          }
        }
      }
    }
  }
  const store = createStore(rootReducer, mockState)

  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      pluginId: 'bitcoin',
      walletName: 'My bitcoin wallet',
      onPress: () => undefined
    }
    const actual = renderer.render(
      <Provider store={store}>
        <CreateWalletSelectCryptoRow {...props}>
          <IonIcon size={26} color="#66EDA8" name="chevron-forward-outline" />
        </CreateWalletSelectCryptoRow>
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
