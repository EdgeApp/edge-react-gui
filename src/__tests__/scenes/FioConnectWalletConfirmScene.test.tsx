import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { FioConnectWalletConfirmScene } from '../../components/scenes/Fio/FioConnectWalletConfirmScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioConnectWalletConfirm', () => {
  const fakeWallet: any = {
    currencyCode: 'FIO',
    nativeAmount: '100',
    networkFee: '1',
    blockHeight: 34,
    date: 220322,
    txid: '0x34346463',
    signedTx: '0xdgs3442',
    ourReceiveAddresses: ['FioAddress'],
    id: 'wallet-fio-id',
    getAddresses: async () =>
      await Promise.resolve([{ publicAddress: 'address123' }])
  }

  const mockState: FakeState = {
    core: {
      account: {
        currencyWallets: {
          'wallet-fio-id': fakeWallet
        },
        watch: () => () => {}
      }
    },
    ui: {
      fio: {
        connectedWalletsByFioAddress: {
          MyFioAddress: { 'FIO:FIO': 'wallet-fio-id' }
        }
      }
    },
    network: {
      isConnected: true
    }
  }

  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders initialState={mockState}>
        <FioConnectWalletConfirmScene
          {...fakeEdgeAppSceneProps('fioConnectToWalletsConfirm', {
            walletId: fakeWallet.id,
            fioAddressName: 'MyFioAddress',
            walletsToConnect: [],
            walletsToDisconnect: []
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
