import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioConnectWalletConfirm } from '../../components/scenes/Fio/FioConnectWalletConfirmScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioConnectWalletConfirm', () => {
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
        {...fakeSceneProps('fioConnectToWalletsConfirm', {
          fioWallet: fakeWallet,
          fioAddressName: 'MyFioAddress',
          walletsToConnect: [],
          walletsToDisconnect: []
        })}
        ccWalletMap={['FIO'] as any}
        isConnected
        updateConnectedWallets={(fioAddress, ccWalletMap) => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
