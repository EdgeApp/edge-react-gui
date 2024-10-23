import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioAddressSettingsComponent } from '../../components/scenes/Fio/FioAddressSettingsScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioAddressSettingsComponent', () => {
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
      ourReceiveAddresses: ['FioAddress'],
      id: 'id'
    }

    const actual = renderer.render(
      <FioAddressSettingsComponent
        {...fakeEdgeAppSceneProps('fioAddressSettings', {
          walletId: fakeWallet.id,
          fioAddressName: 'MyFioAddress'
        })}
        wallet={fakeWallet}
        isConnected
        refreshAllFioAddresses={async () => {}}
        theme={getTheme()}
        onLogEvent={() => {}}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
