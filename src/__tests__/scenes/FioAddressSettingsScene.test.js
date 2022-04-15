/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioAddressSettingsComponent } from '../../components/scenes/FioAddressSettingsScene'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('FioAddressSettingsComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      showAddBundledTxs: true,
      showTransfer: true,
      isConnected: true,
      refreshAllFioAddresses: () => undefined,
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
          fioAddressName: 'MyFioAddress'
        }
      },
      theme: getTheme()
    }
    const actual = renderer.render(<FioAddressSettingsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
