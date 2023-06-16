import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioAddressSettingsComponent } from '../../components/scenes/Fio/FioAddressSettingsScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('FioAddressSettingsComponent', () => {
  const nonce = fakeNonce(0)
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      currencyCode: 'FIO',
      nativeAmount: '100',
      networkFee: '1',
      blockHeight: 34,
      date: 220322,
      txid: '0x34346463',
      signedTx: '0xdgs3442',
      ourReceiveAddresses: ['FioAddress']
    }

    const actual = renderer.render(
      <FioAddressSettingsComponent
        navigation={fakeNavigation}
        isConnected
        refreshAllFioAddresses={() => undefined}
        route={{
          key: `fioAddressSettings-${nonce()}`,
          name: 'fioAddressSettings',
          params: {
            fioWallet: fakeWallet,
            fioAddressName: 'MyFioAddress'
          }
        }}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
