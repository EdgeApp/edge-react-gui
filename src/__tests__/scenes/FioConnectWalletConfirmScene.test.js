/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioConnectWalletConfirm } from '../../components/scenes/FioConnectWalletConfirmScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('FioConnectWalletConfirm', () => {
  it('should render with loading props', () => {
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
      updateConnectedWallets: (fioAddress, ccWalletMap) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<FioConnectWalletConfirm {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
