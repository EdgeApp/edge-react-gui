import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { FioAddressRegister } from '../../components/scenes/Fio/FioAddressRegisterScene'
import { getTheme } from '../../components/services/ThemeContext'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioAddressRegister', () => {
  it('should render with loading props', () => {
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

    const rendered = render(
      <FakeProviders>
        <FioAddressRegister
          {...fakeEdgeAppSceneProps('fioAddressRegister', undefined)}
          fioWallets={[fakeWallet]}
          fioPlugin={
            {
              currencyInfo: 'FIO plugin'
            } as any
          }
          isConnected
          createFioWallet={async () => 'myFio@fio' as any}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
