import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioAddressDetails } from '../../components/scenes/Fio/FioAddressDetailsScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('FioAddressDetails', () => {
  const nonce = fakeNonce(0)
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
      <FioAddressDetails
        navigation={fakeNavigation}
        fioWallets={[fakeWallet]}
        route={{
          key: `fioAddressDetails-${nonce()}`,
          name: 'fioAddressDetails',
          params: {
            fioAddressName: 'Fio@edge',
            bundledTxs: 100
          }
        }}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
