import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { CreateWalletSelectCryptoRow } from '../../components/themed/CreateWalletSelectCryptoRow'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('WalletListRow', () => {
  const mockState: FakeState = {
    core: {
      account: {
        currencyConfig: {
          bitcoin: {
            currencyInfo: {
              currencyCode: 'BTC',
              pluginId: 'bitcoin'
            }
          }
        },
        watch: () => () => {}
      }
    }
  }

  it('should render with loading props', () => {
    const pluginId = 'bitcoin'
    const walletName = 'My bitcoin wallet'
    const onPress = () => undefined
    const rightSide = <IonIcon size={26} color="#66EDA8" name="chevron-forward-outline" />

    const rendered = render(
      <FakeProviders initialState={mockState}>
        <CreateWalletSelectCryptoRow pluginId={pluginId} tokenId={null} walletName={walletName} onPress={onPress} rightSide={rightSide} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
