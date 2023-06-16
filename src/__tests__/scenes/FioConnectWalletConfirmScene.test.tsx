import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioConnectWalletConfirm } from '../../components/scenes/Fio/FioConnectWalletConfirmScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('FioConnectWalletConfirm', () => {
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
      <FioConnectWalletConfirm
        navigation={fakeNavigation}
        ccWalletMap={['FIO'] as any}
        isConnected
        route={{
          key: `fioConnectToWalletsConfirm-${nonce()}`,
          name: 'fioConnectToWalletsConfirm',
          params: {
            fioWallet: fakeWallet,
            fioAddressName: 'MyFioAddress',
            walletsToConnect: [],
            walletsToDisconnect: []
          }
        }}
        updateConnectedWallets={(fioAddress, ccWalletMap) => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
