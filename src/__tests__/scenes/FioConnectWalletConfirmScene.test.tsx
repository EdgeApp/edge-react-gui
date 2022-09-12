/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioConnectWalletConfirm } from '../../components/scenes/FioConnectWalletConfirmScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('FioConnectWalletConfirm', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      ccWalletMap: ['FIO'],
      isConnected: true,

      route: {
        params: {
          fioWallet: [
            {
              currencyCode: 'FIO',
              nativeAmount: '100',
              networkFee: '1',
              blockHeight: 34,
              date: 220322,
              txid: '0x34346463',
              signedTx: '0xdgs3442',
              ourReceiveAddresses: ['FioAddress']
            }
          ],
          fioAddressName: 'MyFioAddress',
          walletsToConnect: [],
          walletsToDisconnect: []
        }
      },

      // @ts-expect-error
      updateConnectedWallets: (fioAddress, ccWalletMap) => undefined,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<FioConnectWalletConfirm {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
