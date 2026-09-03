import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { WalletShareChooserModal } from '../../components/modals/WalletShareChooserModal'
import { WalletShareConfirmModal } from '../../components/modals/WalletShareConfirmModal'
import { WalletShareModeModal } from '../../components/modals/WalletShareModeModal'
import { WalletShareReceivedModal } from '../../components/modals/WalletShareReceivedModal'
import { WalletShareSelectModal } from '../../components/modals/WalletShareSelectModal'
import { WalletShareSelectRow } from '../../components/rows/WalletShareSelectRow'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { makeTestWalletListItem } from '../../util/fake/fakeSearchTestData'

const unwatch = (): void => {}

function makeWallet(
  id: string,
  name: string,
  extra: Partial<EdgeCurrencyWallet> = {}
): EdgeCurrencyWallet {
  return {
    id,
    name,
    currencyInfo: btcCurrencyInfo,
    currencyConfig: makeFakeCurrencyConfig(btcCurrencyInfo),
    balanceMap: new Map([[null, '123456789']]),
    enabledTokenIds: [],
    canSign: true,
    watch: () => unwatch,
    on: () => unwatch,
    ...extra
  } as unknown as EdgeCurrencyWallet
}

const walletA = makeWallet('wallet-a', 'Spending')
const walletB = makeWallet('wallet-b', 'Savings')
const viewOnlyWallet = makeWallet('wallet-c', 'Shared to me', {
  canSign: false
})
const moneroWallet = makeWallet('wallet-d', 'My Monero', {
  currencyInfo: {
    ...btcCurrencyInfo,
    pluginId: 'monero',
    currencyCode: 'XMR',
    displayName: 'Monero',
    unsafeSyncNetwork: true
  }
})

const fakeState: FakeState = {
  sortedWalletList: [
    makeTestWalletListItem(walletA),
    makeTestWalletListItem(walletB)
  ] as any
}

describe('Wallet sharing modals', () => {
  it('chooser renders both directions', () => {
    const rendered = render(
      <FakeProviders>
        <WalletShareChooserModal bridge={fakeAirshipBridge} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('select row swaps the icon for a checkmark when selected', () => {
    const unselected = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareSelectRow
          wallet={walletA}
          selected={false}
          onPress={() => {}}
        />
      </FakeProviders>
    )
    const selected = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareSelectRow wallet={walletA} selected onPress={() => {}} />
      </FakeProviders>
    )
    expect(unselected.toJSON()).toMatchSnapshot('unselected')
    expect(selected.toJSON()).toMatchSnapshot('selected')
    expect(JSON.stringify(unselected.toJSON())).not.toEqual(
      JSON.stringify(selected.toJSON())
    )
    unselected.unmount()
    selected.unmount()
  })

  it('select modal lists mainnet wallets', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareSelectModal bridge={fakeAirshipBridge} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('mode modal pins spend-only and view-only-source wallets', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareModeModal
          bridge={fakeAirshipBridge}
          wallets={[walletA, moneroWallet, viewOnlyWallet]}
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('confirm modal shows each mode', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareConfirmModal
          bridge={fakeAirshipBridge}
          wallets={[walletA, walletB]}
          specs={[
            { walletId: walletA.id, mode: 'view-only' },
            { walletId: walletB.id, mode: 'spend' }
          ]}
          onConfirm={async () => {}}
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('received modal lists what arrived', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareReceivedModal
          bridge={fakeAirshipBridge}
          entries={[
            { wallet: walletA, mode: 'view-only' },
            { wallet: walletB, mode: 'spend' }
          ]}
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
