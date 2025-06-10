import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { FioAddressSettingsComponent } from '../../components/scenes/Fio/FioAddressSettingsScene'
import { getTheme } from '../../components/services/ThemeContext'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioAddressSettingsComponent', () => {
  it('should render with loading props', () => {
    const fakeWallet: any = {
      currencyCode: 'FIO',
      nativeAmount: '100',
      networkFee: '1',
      blockHeight: 34,
      date: 220322,
      txid: '0x34346463',
      signedTx: '0xdgs3442',
      ourReceiveAddresses: ['FioAddress'],
      id: 'id'
    }

    const rendered = render(
      <FakeProviders>
        <FioAddressSettingsComponent
          {...fakeEdgeAppSceneProps('fioAddressSettings', {
            walletId: fakeWallet.id,
            fioAddressName: 'MyFioAddress'
          })}
          wallet={fakeWallet}
          isConnected
          refreshAllFioAddresses={async () => {}}
          theme={getTheme()}
          onLogEvent={() => {}}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
