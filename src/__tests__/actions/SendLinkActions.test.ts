import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import type { DeepLink } from '../../types/DeepLinkTypes'

const showSpy = jest.spyOn(Airship, 'show')

/** An account whose wallets have all loaded, one per entry. */
function makeState(wallets: Record<string, string>): any {
  const currencyWallets: Record<string, unknown> = {}
  for (const walletId of Object.keys(wallets)) {
    currencyWallets[walletId] = {
      currencyInfo: { pluginId: wallets[walletId] },
      enabledTokenIds: []
    }
  }
  return {
    core: {
      account: {
        loggedIn: true,
        activeWalletIds: Object.keys(wallets),
        currencyWallets,
        currencyWalletErrors: {},
        currencyConfig: {},
        watch: () => () => {}
      },
      context: { clientId: '1111111111111111' }
    },
    ui: { settings: { defaultIsoFiat: 'iso:USD' } }
  }
}

/**
 * Follow a send link, answering any picker it raises with `pick`, and return
 * the props each picker was shown with.
 */
async function follow(
  link: DeepLink,
  state: any,
  pick: unknown = undefined
): Promise<{ followed: boolean; pickers: any[]; navigation: any }> {
  const pickers: any[] = []
  showSpy.mockImplementation(async (render: any) => {
    pickers.push(render({}).props)
    return pick
  })
  const navigation: any = { navigate: jest.fn(), push: jest.fn() }
  const followed = await launchDeepLink(navigation, link)(
    jest.fn() as any,
    () => state
  )
  return { followed, pickers, navigation }
}

describe('launchDeepLink send', () => {
  beforeEach(() => {
    showSpy.mockReset()
  })

  it('auto-picks the one wallet holding the named asset', async () => {
    const { followed, pickers, navigation } = await follow(
      {
        type: 'send',
        asset: { pluginId: 'bitcoin', tokenId: null },
        stealth: true
      },
      makeState({ a: 'bitcoin', b: 'ethereum' })
    )

    expect(followed).toBe(true)
    expect(pickers).toEqual([])
    expect(navigation.push).toHaveBeenCalledWith('send2', {
      walletId: 'a',
      tokenId: null,
      hiddenFeaturesMap: { scamWarning: false },
      stealth: true
    })
  })

  it('narrows the picker to the named asset when several wallets hold it', async () => {
    const { followed, pickers, navigation } = await follow(
      {
        type: 'send',
        asset: { pluginId: 'bitcoin', tokenId: null },
        stealth: true
      },
      makeState({ a: 'bitcoin', b: 'bitcoin', c: 'ethereum' }),
      { type: 'wallet', walletId: 'b', tokenId: null }
    )

    expect(followed).toBe(true)
    expect(pickers).toHaveLength(1)
    expect(pickers[0].allowedAssets).toEqual([
      { pluginId: 'bitcoin', tokenId: null }
    ])
    expect(pickers[0].headerTitle).toBe(lstrings.select_wallet_to_send_from)
    expect(pickers[0].showCreateWallet).toBeUndefined()
    expect(navigation.push).toHaveBeenCalledWith('send2', {
      walletId: 'b',
      tokenId: null,
      hiddenFeaturesMap: { scamWarning: false },
      stealth: true
    })
  })

  it('falls back to every wallet when none holds the named asset', async () => {
    const { followed, pickers, navigation } = await follow(
      {
        type: 'send',
        asset: { pluginId: 'monero', tokenId: null },
        stealth: true
      },
      makeState({ a: 'bitcoin', c: 'ethereum' }),
      { type: 'wallet', walletId: 'c', tokenId: null }
    )

    expect(followed).toBe(true)
    expect(pickers).toHaveLength(1)
    expect(pickers[0].allowedAssets).toBeUndefined()
    expect(pickers[0].showCreateWallet).toBeUndefined()
    expect(pickers[0].headerTitle).toBe(lstrings.select_wallet_to_send_from)
    expect(navigation.push).toHaveBeenCalledWith('send2', {
      walletId: 'c',
      tokenId: null,
      hiddenFeaturesMap: { scamWarning: false },
      stealth: true
    })
  })

  it('opens the balance card picker when the link names no asset', async () => {
    const { followed, pickers, navigation } = await follow(
      { type: 'send', stealth: true },
      makeState({ a: 'bitcoin' }),
      { type: 'wallet', walletId: 'a', tokenId: null }
    )

    // Even a lone wallet is offered rather than auto-picked, as the balance
    // card's Send button does:
    expect(followed).toBe(true)
    expect(pickers).toHaveLength(1)
    expect(pickers[0].allowedAssets).toBeUndefined()
    expect(pickers[0].showCreateWallet).toBeUndefined()
    expect(pickers[0].headerTitle).toBe(lstrings.select_wallet_to_send_from)
    expect(navigation.push).toHaveBeenCalledTimes(1)
  })

  it('does not navigate when the picker is dismissed', async () => {
    const { followed, navigation } = await follow(
      { type: 'send', stealth: true },
      makeState({ a: 'bitcoin' }),
      undefined
    )

    expect(followed).toBe(false)
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it('does not navigate when the narrowed picker is dismissed', async () => {
    const { followed, pickers, navigation } = await follow(
      {
        type: 'send',
        asset: { pluginId: 'bitcoin', tokenId: null },
        stealth: true
      },
      makeState({ a: 'bitcoin', b: 'bitcoin' }),
      undefined
    )

    expect(followed).toBe(false)
    expect(pickers).toHaveLength(1)
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it('drops a send link that arrives while its picker is open', async () => {
    let pick: (result: unknown) => void = () => {}
    showSpy.mockImplementation(
      async () =>
        await new Promise(resolve => {
          pick = resolve
        })
    )
    const state = makeState({ a: 'bitcoin', b: 'bitcoin' })
    const dispatch: any = jest.fn()
    const navigation: any = { navigate: jest.fn(), push: jest.fn() }
    const btcLink: DeepLink = {
      type: 'send',
      asset: { pluginId: 'bitcoin', tokenId: null },
      stealth: true
    }

    const first = launchDeepLink(navigation, btcLink)(dispatch, () => state)
    for (let i = 0; i < 20; i++) await Promise.resolve()
    const second = await launchDeepLink(navigation, btcLink)(
      dispatch,
      () => state
    )

    // A second picker would stack on the first, then push a second scene:
    expect(second).toBe(false)
    expect(showSpy).toHaveBeenCalledTimes(1)

    pick({ type: 'wallet', walletId: 'b', tokenId: null })
    expect(await first).toBe(true)
    expect(navigation.push).toHaveBeenCalledTimes(1)
  })

  it('leaves the stealth param off for a plain send link', async () => {
    const { navigation } = await follow(
      {
        type: 'send',
        asset: { pluginId: 'bitcoin', tokenId: null },
        stealth: false
      },
      makeState({ a: 'bitcoin' })
    )

    expect(navigation.push).toHaveBeenCalledWith('send2', {
      walletId: 'a',
      tokenId: null,
      hiddenFeaturesMap: { scamWarning: false },
      stealth: undefined
    })
  })
})
