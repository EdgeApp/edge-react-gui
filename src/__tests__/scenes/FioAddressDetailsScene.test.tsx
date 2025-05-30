import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { FioAddressDetails } from '../../components/scenes/Fio/FioAddressDetailsScene'
import { getTheme } from '../../components/services/ThemeContext'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioAddressDetails', () => {
  it('should render with loading props', () => {
    const fakeWallet: any = {
      blockHeight: 34,
      currencyCode: 'FIO',
      date: 220322,
      nativeAmount: '100',
      networkFee: '1',
      ourReceiveAddresses: ['FioAddress'],
      signedTx: '0xdgs3442',
      stakingStatus: { stakedAmounts: [] },
      txid: '0x34346463'
    }

    const rendered = render(
      <FakeProviders>
        <FioAddressDetails
          {...fakeEdgeAppSceneProps('fioAddressDetails', {
            fioAddressName: 'Fio@edge',
            bundledTxs: 100
          })}
          fioWallets={[fakeWallet]}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
