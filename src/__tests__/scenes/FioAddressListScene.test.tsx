/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioAddressList } from '../../components/scenes/FioAddressListScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('FioAddressList', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      fioAddresses: [
        {
          name: 'fio@edge',
          bundledTxs: 100,
          walletId: '0x374236418'
        }
      ],
      fioDomains: [
        {
          name: 'myFio@fio',
          expiration: '12-10-23',
          isPublic: true,
          walletId: '0x24623872138'
        }
      ],
      fioWallets: [
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
      loading: true,
      isConnected: true,
      refreshAllFioAddresses: () => undefined,
      navigation: undefined,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<FioAddressList {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
