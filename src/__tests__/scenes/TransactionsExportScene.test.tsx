import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import { TransactionsExportScene } from '../../components/scenes/TransactionsExportScene'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

const mockShareOpen = jest.fn(async (_opts: unknown) => {})
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {
    open: async (opts: unknown) => {
      await mockShareOpen(opts)
    }
  }
}))

let mockTrusted = true
jest.mock('../../actions/SettingsActions', () => ({
  ...jest.requireActual<object>('../../actions/SettingsActions'),
  syncedSettingsAreTrusted: () => mockTrusted
}))

const mockFill = jest.fn(async () => ({ asked: 0, unavailable: 0 }))
jest.mock('../../actions/TransactionExportActions', () => ({
  updateTxsFiat: () => async () => await mockFill()
}))

const fakeCurrencyConfig = makeFakeCurrencyConfig(btcCurrencyInfo)

function makeWallet(): any {
  return {
    id: 'wallet-1',
    name: 'Wallet',
    type: 'wallet:bitcoin',
    currencyConfig: fakeCurrencyConfig,
    currencyInfo: fakeCurrencyConfig.currencyInfo,
    fiatCurrencyCode: 'iso:USD',
    balanceMap: new Map([[null, '0']]),
    enabledTokenIds: [],
    disklet: {
      getText: async () => {
        throw Object.assign(new Error('Cannot load "exportTxInfo.json"'), {
          code: 'ENOENT'
        })
      },
      setText: async () => {}
    },
    getTransactions: jest.fn(async () => [
      {
        txid: 'tx-1',
        date: 1700000000,
        currencyCode: 'BTC',
        tokenId: null,
        nativeAmount: '-50000',
        networkFee: '1000',
        blockHeight: 800000,
        ourReceiveAddresses: [],
        signedTx: '',
        walletId: 'wallet-1',
        isSend: true,
        memos: [],
        metadata: { name: 'Coffee', exchangeAmount: {} }
      }
    ]),
    watch() {}
  }
}

/**
 * The order the export scene acts in, which the plan tests cannot see.
 *
 * A refusal has to come before any history or rates work, and the warnings
 * have to be read before the share sheet covers the scene. Both were bugs:
 * the refusal used to follow a rate fetch of up to ten minutes, and the
 * warnings were a toast that faded under the sheet.
 */
describe('TransactionsExportScene', () => {
  let shown: unknown[]
  let order: string[]

  beforeEach(() => {
    shown = []
    order = []
    mockShareOpen.mockImplementation(async () => {
      order.push('share')
    })
    jest.spyOn(Airship, 'show').mockImplementation((async (render: any) => {
      shown.push(render({ resolve() {}, reject() {}, on() {} }))
      order.push('modal')
      return 'ok'
    }) as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockTrusted = true
    mockFill.mockReset()
    mockFill.mockImplementation(async () => ({ asked: 0, unavailable: 0 }))
  })

  const fakeState: FakeState = {
    core: {
      account: {
        currencyWallets: {},
        currencyConfig: { bitcoin: fakeCurrencyConfig },
        watch() {}
      }
    }
  }

  async function pressExport(wallet: any): Promise<void> {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <TransactionsExportScene
          {...fakeEdgeAppSceneProps('transactionsExport', {
            sourceWallet: wallet,
            tokenId: null
          })}
        />
      </FakeProviders>
    )
    await act(async () => {
      fireEvent.press(rendered.getByText(lstrings.string_export))
    })
  }

  it('refuses before reading any history when the settings are untrusted', async () => {
    mockTrusted = false
    const wallet = makeWallet()
    await pressExport(wallet)
    expect(wallet.getTransactions).not.toHaveBeenCalled()
    expect(mockFill).not.toHaveBeenCalled()
    expect((shown[0] as any).props.message).toBe(
      lstrings.export_transaction_settings_unreadable
    )
    expect(mockShareOpen).not.toHaveBeenCalled()
  })

  it('shows the unpriced count before the share sheet opens', async () => {
    mockFill.mockImplementation(async () => ({ asked: 1, unavailable: 1 }))
    await pressExport(makeWallet())
    expect(order).toStrictEqual(['modal', 'share'])
    expect((shown[0] as any).props.message).toMatch(/1 of the 1/)
  })
})
