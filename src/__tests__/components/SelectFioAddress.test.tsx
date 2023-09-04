import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { SelectFioAddressComponent } from '../../components/themed/SelectFioAddress'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('SelectFioAddress', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <SelectFioAddressComponent
        navigation={fakeNavigation}
        selected="string"
        memo="TX"
        memoError="memo error"
        onSelect={() => undefined}
        onMemoChange={() => undefined}
        fioRequest={{
          fio_request_id: 123123,
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
          status: 'requested',
          time_stamp: '11:11',
          fioWalletId: 'myWallet'
        }}
        currencyCode="BTC"
        isSendUsingFioAddress
        fioAddresses={[]}
        fioWallets={[]}
        selectedWalletId="123123"
        refreshAllFioAddresses={async () => {}}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
