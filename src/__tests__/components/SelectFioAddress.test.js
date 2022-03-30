/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { SelectFioAddressComponent } from '../../components/themed/SelectFioAddress.js'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      selected: 'string',
      memo: 'TX',
      memoError: 'memo error',
      onSelect: () => undefined,
      onMemoChange: () => undefined,
      fioRequest: {
        fio_request_id: '123123',
        content: {
          payee_public_address: '123123',
          amount: '123123',
          token_code: 'LINK',
          chain_code: 'ETH',
          memo: 'myTX'
        },
        payee_fio_address: 'fio@fio',
        payer_fio_address: 'fio2@fio',
        payer_fio_public_key: '123123',
        status: 'pending',
        time_stamp: '11:11',
        fioWalletId: 'myWallet'
      },
      isSendUsingFioAddress: true,

      fioAddresses: [],
      fioWallets: [],
      selectedWallet: {
        id: '123123',
        type: 'fioWallet',
        name: 'myWallet',
        primaryNativeBalance: '123',
        nativeBalances: '123',
        currencyNames: 'Bitcoin ',
        currencyCode: 'BTC',
        isoFiatCurrencyCode: {
          wallet: {
            fiatCurrencyCode: 'USD'
          }
        }
      },
      fiatCurrencyCode: 'USD',
      symbolImage: '₿',
      symbolImageDarkMono: '₿',
      metaTokens: {
        currencyCode: 'BTC',
        currencyName: 'Bitcoin',
        contractAddress: '123123',
        denominations: [],
        symbolImage: '₿'
      },
      enabledTokens: 'ETH',
      receiveAddress: '123123',
      addressLoadingProgress: 11,
      blockHeight: 11,
      refreshAllFioAddresses: () => undefined,
      theme: getTheme({
        theme: dangerText => undefined
      })
    }

    const actual = renderer.render(<SelectFioAddressComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
