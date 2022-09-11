/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioAddressSettingsComponent } from '../../components/scenes/FioAddressSettingsScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('FioAddressSettingsComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
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
    // @ts-expect-error
    const actual = renderer.render(<FioAddressSettingsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
