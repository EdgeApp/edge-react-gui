/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioAddressDetails } from '../../components/scenes/FioAddressDetailsScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('FioAddressDetails', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
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
      addressChanged: undefined,
      transactionsChanged: [
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

      wcNewContractCall: ['contract call'],
      route: {
        params: {
          fioAddressName: 'Fio@edge',
          bundledTxs: 100
        }
      },
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<FioAddressDetails {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
