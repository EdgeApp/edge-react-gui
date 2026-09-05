import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Switch } from 'react-native'

import { WalletSharedPill } from '../../components/common/WalletSharedPill'
import { WalletShareChooserModal } from '../../components/modals/WalletShareChooserModal'
import { WalletShareConfirmModal } from '../../components/modals/WalletShareConfirmModal'
import { WalletShareHistoryModal } from '../../components/modals/WalletShareHistoryModal'
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
const tokenWallet = makeWallet('wallet-f', 'Has tokens', {
  currencyConfig: makeFakeCurrencyConfig(btcCurrencyInfo, {
    'token-one': {
      currencyCode: 'USDC',
      displayName: 'USD Coin',
      denominations: [{ multiplier: '1000000', name: 'USDC' }],
      networkLocation: {}
    },
    'token-two': {
      currencyCode: 'WBTC',
      displayName: 'Wrapped Bitcoin',
      denominations: [{ multiplier: '100000000', name: 'WBTC' }],
      networkLocation: {}
    }
  }),
  enabledTokenIds: ['token-one', 'token-two']
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
        <WalletShareChooserModal
          bridge={fakeAirshipBridge}
          nickname="Alice"
          onEditNickname={() => {}}
        />
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
        <WalletShareSelectModal
          bridge={fakeAirshipBridge}
          counterpartyName="Bob"
        />
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
    // A spend-only wallet keeps a live toggle, so tapping it can explain
    // itself; a view-only source has nothing to explain and stays dead:
    const [plain, spendOnly, viewOnlySource] =
      rendered.UNSAFE_getAllByType(Switch)
    expect(plain.props.disabled).toBe(false)
    expect(plain.props.value).toBe(false)
    expect(spendOnly.props.disabled).toBe(false)
    expect(spendOnly.props.value).toBe(true)
    expect(viewOnlySource.props.disabled).toBe(true)
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it("mode modal lists a wallet's tokens beneath it", () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareModeModal
          bridge={fakeAirshipBridge}
          wallets={[tokenWallet]}
        />
      </FakeProviders>
    )
    const text = JSON.stringify(rendered.toJSON())
    expect(text).toContain('USD Coin')
    expect(text).toContain('Wrapped Bitcoin')
    // Tokens ride on the parent's keys, so they get no toggle of their own:
    expect(rendered.UNSAFE_getAllByType(Switch)).toHaveLength(1)
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('confirm modal shows each mode', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareConfirmModal
          bridge={fakeAirshipBridge}
          wallets={[walletA, tokenWallet]}
          specs={[
            { walletId: walletA.id, mode: 'viewOnly' },
            { walletId: tokenWallet.id, mode: 'spend' }
          ]}
          counterpartyName="Bob"
          onConfirm={async () => {}}
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('history modal interleaves both directions by date', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareHistoryModal
          bridge={fakeAirshipBridge}
          sharingState={{
            sharedWith: [
              {
                name: 'Bob',
                shareType: 'viewOnly',
                sharingDate: '2026-09-02T10:00:00.000Z'
              }
            ],
            sharedFrom: [
              {
                name: 'Carol',
                shareType: 'spend',
                sharingDate: '2026-09-01T10:00:00.000Z'
              }
            ]
          }}
        />
      </FakeProviders>
    )
    const text = JSON.stringify(rendered.toJSON())
    // Oldest first, whichever list it came from:
    expect(text.indexOf('2026-09-01')).toBeLessThan(text.indexOf('2026-09-02'))
    expect(text).toContain('Carol')
    expect(text).toContain('Bob')
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('shared pill only renders for a shared wallet', () => {
    const plain = render(
      <FakeProviders initialState={fakeState}>
        <WalletSharedPill wallet={walletA} />
      </FakeProviders>
    )
    expect(plain.toJSON()).toEqual(null)
    plain.unmount()

    const shared = render(
      <FakeProviders initialState={fakeState}>
        <WalletSharedPill
          wallet={makeWallet('wallet-e', 'Shared one', {
            sharingState: {
              sharedWith: [
                {
                  name: 'Bob',
                  shareType: 'spend',
                  sharingDate: '2026-09-01T10:00:00.000Z'
                }
              ],
              sharedFrom: []
            }
          } as any)}
        />
      </FakeProviders>
    )
    expect(JSON.stringify(shared.toJSON())).toContain('Shared')
    expect(shared.toJSON()).toMatchSnapshot()
    shared.unmount()
  })

  it('received modal lists what arrived', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareReceivedModal
          bridge={fakeAirshipBridge}
          entries={[
            { wallet: walletA, mode: 'viewOnly' },
            { wallet: walletB, mode: 'spend' }
          ]}
          counterpartyName="Alice"
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('the sharer sees the same list, titled for their side', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletShareReceivedModal
          bridge={fakeAirshipBridge}
          variant="shared"
          entries={[
            { wallet: walletA, mode: 'viewOnly' },
            { wallet: walletB, mode: 'spend' }
          ]}
          counterpartyName="Bob"
        />
      </FakeProviders>
    )
    const text = JSON.stringify(rendered.toJSON())
    expect(text).toContain('You have shared access to the following wallets')
    expect(text).not.toContain('You have received')
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
