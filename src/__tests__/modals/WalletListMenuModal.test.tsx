import { describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import type { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { WalletListMenuModal } from '../../components/modals/WalletListMenuModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

const WALLET_ID = 'wallet-1'
const TOKEN_ID = 'token-1'
const EXPLORER = 'https://explorer.example/address/%s'
const EXPLORER_ENTRY = 'walletListMenu.viewInExplorer'
const ALWAYS_SHOWN_ENTRY = 'walletListMenu.resync'

function makeAccount(pluginId: string, addressExplorer: string): any {
  const currencyInfo = {
    addressExplorer,
    currencyCode: 'TEST',
    displayName: 'Test',
    pluginId,
    walletType: `wallet:${pluginId}`
  }
  const allTokens = { [TOKEN_ID]: { currencyCode: 'TOK', denominations: [] } }
  return {
    currencyConfig: {
      [pluginId]: {
        allTokens,
        builtinTokens: {},
        currencyInfo,
        watch: () => () => {}
      }
    },
    currencyWallets: {
      [WALLET_ID]: {
        currencyConfig: { allTokens },
        currencyInfo,
        id: WALLET_ID,
        name: 'My Wallet',
        watch: () => () => {}
      }
    },
    listSplittableWalletTypes: async () => [],
    username: 'user',
    watch: () => () => {}
  }
}

/** Renders the menu and reports whether it offers the explorer entry. */
async function isOffered(
  pluginId: string,
  addressExplorer: string,
  tokenId: EdgeTokenId = null
): Promise<boolean> {
  const rendered = render(
    <FakeProviders
      initialState={{
        core: { account: makeAccount(pluginId, addressExplorer) }
      }}
    >
      <WalletListMenuModal
        bridge={fakeAirshipBridge}
        navigation={fakeNavigation as any}
        tokenId={tokenId}
        walletId={WALLET_ID}
      />
    </FakeProviders>
  )
  // The menu builds its options in an async effect:
  await act(async () => {
    await jest.advanceTimersByTimeAsync(100)
  })
  expect(rendered.queryByTestId(ALWAYS_SHOWN_ENTRY)).not.toBeNull()
  const offered = rendered.queryByTestId(EXPLORER_ENTRY) != null
  rendered.unmount()
  return offered
}

describe('WalletListMenuModal View in Explorer entry', () => {
  it('shows for transparent wallets and their tokens', async () => {
    expect(await isOffered('ethereum', EXPLORER)).toBe(true)
    expect(await isOffered('bitcoin', EXPLORER)).toBe(true)
    expect(await isOffered('ethereum', EXPLORER, TOKEN_ID)).toBe(true)
  })

  it('hides for privacy wallets, even with an explorer template', async () => {
    for (const pluginId of ['monero', 'piratechain', 'zano', 'zcash']) {
      expect(await isOffered(pluginId, EXPLORER)).toBe(false)
    }
    expect(await isOffered('zano', EXPLORER, TOKEN_ID)).toBe(false)
  })

  it('hides without an explorer template', async () => {
    expect(await isOffered('ethereum', '')).toBe(false)
    expect(await isOffered('ethereum', '', TOKEN_ID)).toBe(false)
  })

  it('shows for keys-only plugins', async () => {
    expect(await isOffered('bitcoinsv', EXPLORER)).toBe(true)
  })
})
