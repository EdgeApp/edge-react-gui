import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { SelectFioAddressComponent } from '../../components/themed/SelectFioAddress'

describe('SelectFioAddress', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
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
    }

    const actual = renderer.render(
      <SelectFioAddressComponent
        selected="string"
        memo="TX"
        memoError="memo error"
        onSelect={() => undefined}
        onMemoChange={() => undefined}
        fioRequest={{
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
        }}
        currencyCode="BTC"
        isSendUsingFioAddress
        fioAddresses={[]}
        fioWallets={[]}
        selectedWallet={fakeWallet}
        refreshAllFioAddresses={() => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
