import { describe, expect, it, jest } from '@jest/globals'

import {
  launchDeepLink,
  releaseLinkPromo,
  waitForWallets
} from '../../actions/DeepLinkingActions'
import { withCardPromoId } from '../../actions/WalletListActions'
import { pickWallet } from '../../components/modals/WalletListModal'
import type { DeepLink } from '../../types/DeepLinkTypes'
import type { Action } from '../../types/reduxActions'
import type { LinkPromo } from '../../types/types'

jest.mock('../../components/modals/WalletListModal', () => ({
  ...jest.requireActual<object>('../../components/modals/WalletListModal'),
  pickWallet: jest.fn()
}))
const mockPickWallet = pickWallet as jest.MockedFunction<typeof pickWallet>

const buyLink: DeepLink = {
  type: 'rampCreate',
  direction: 'buy',
  asset: { pluginId: 'bitcoin', tokenId: null }
}
const swapLink: DeepLink = {
  type: 'swap',
  buyAsset: { pluginId: 'bitcoin', tokenId: null }
}

describe('withCardPromoId', () => {
  it('stamps the card id onto a ramp link that carries none', () => {
    expect(withCardPromoId(buyLink, 'card1')).toEqual({
      ...buyLink,
      promoId: 'card1'
    })
  })

  it('stamps the card id onto a swap link that carries none', () => {
    expect(withCardPromoId(swapLink, 'card1')).toEqual({
      ...swapLink,
      promoId: 'card1'
    })
  })

  it('leaves a promo id already in the URL alone', () => {
    // An external link has no other way to name a promo, so an explicit value
    // in the URL is a deliberate override of the card that displayed it.
    const link = { ...buyLink, promoId: 'url1' }
    expect(withCardPromoId(link, 'card1')).toEqual(link)
  })

  it('reaches through an affiliate wrapper', () => {
    const wrapped: DeepLink = {
      type: 'affiliate',
      installerId: 'bob',
      link: buyLink
    }
    expect(withCardPromoId(wrapped, 'card1')).toEqual({
      ...wrapped,
      link: { ...buyLink, promoId: 'card1' }
    })
  })

  it('reaches through a marketing wrapper', () => {
    const wrapped: DeepLink = {
      type: 'marketing',
      campaignId: 'summer',
      link: swapLink
    }
    expect(withCardPromoId(wrapped, 'card1')).toEqual({
      ...wrapped,
      link: { ...swapLink, promoId: 'card1' }
    })
  })

  it('leaves a marketing wrapper with no inner link alone', () => {
    const wrapped: DeepLink = { type: 'marketing', campaignId: 'summer' }
    expect(withCardPromoId(wrapped, 'card1')).toEqual(wrapped)
  })

  it('leaves link types with nothing to attribute alone', () => {
    const link: DeepLink = { type: 'azteco', uri: 'https://azte.co/?c=' }
    expect(withCardPromoId(link, 'card1')).toEqual(link)
  })

  it('is a no-op for an empty or missing card id', () => {
    expect(withCardPromoId(buyLink, undefined)).toEqual(buyLink)
    expect(withCardPromoId(buyLink, '')).toEqual(buyLink)
  })
})

describe('releaseLinkPromo', () => {
  const run = (
    linkPromo: LinkPromo | null,
    tab: LinkPromo['tab']
  ): Action[] => {
    const dispatched: Action[] = []
    const dispatch = jest.fn((action: Action) => {
      dispatched.push(action)
      return action
    })
    const getState = (): { linkPromo: LinkPromo | null } => ({ linkPromo })

    releaseLinkPromo(tab)(dispatch as any, getState as any)
    return dispatched
  }

  it('releases the promo when its own tab is left', () => {
    expect(run({ promoId: 'bob', tab: 'buyTab' }, 'buyTab')).toEqual([
      { type: 'LINK_PROMO/SET', data: { linkPromo: null } }
    ])
  })

  it('leaves a promo a newer link claimed for another tab', () => {
    // The link dispatches before it navigates, so the tab it navigates AWAY
    // from blurs while the new promo is already in the slice. Releasing there
    // would throw away the attribution that link just set.
    expect(run({ promoId: 'carol', tab: 'swapTab' }, 'buyTab')).toEqual([])
  })

  it('does nothing when no promo is held', () => {
    expect(run(null, 'buyTab')).toEqual([])
  })
})

describe('waitForWallets', () => {
  type Prop =
    | 'loggedIn'
    | 'activeWalletIds'
    | 'currencyWallets'
    | 'currencyWalletErrors'

  /** A stand-in account whose wallet maps change and notify watchers. */
  function makeAccount(activeWalletIds: string[]): {
    account: any
    load: (walletId: string) => void
    fail: (walletId: string) => void
    logout: () => void
    watcherCount: () => number
  } {
    const watchers: Array<{ prop: Prop; callback: () => void }> = []
    const currencyWallets: Record<string, unknown> = {}
    const currencyWalletErrors: Record<string, unknown> = {}
    const account = {
      loggedIn: true,
      activeWalletIds,
      currencyWallets,
      currencyWalletErrors,
      watch: (prop: Prop, callback: () => void) => {
        const entry = { prop, callback }
        watchers.push(entry)
        return () => {
          watchers.splice(watchers.indexOf(entry), 1)
        }
      }
    }
    const notify = (prop: Prop): void => {
      for (const w of [...watchers]) if (w.prop === prop) w.callback()
    }
    return {
      account,
      load: walletId => {
        account.currencyWallets = { ...account.currencyWallets, [walletId]: {} }
        notify('currencyWallets')
      },
      fail: walletId => {
        account.currencyWalletErrors = {
          ...account.currencyWalletErrors,
          [walletId]: new Error('boom')
        }
        notify('currencyWalletErrors')
      },
      logout: () => {
        account.loggedIn = false
        notify('loggedIn')
      },
      watcherCount: () => watchers.length
    }
  }

  /** The value a promise settled with, or 'pending' if it has not. */
  const peek = async <T>(promise: Promise<T>): Promise<T | 'pending'> => {
    let result: T | 'pending' = 'pending'
    promise
      .then(value => {
        result = value
      })
      .catch(() => {})
    for (let i = 0; i < 20; i++) await Promise.resolve()
    return result
  }

  it('resolves at once when every wallet has loaded', async () => {
    const { account, load } = makeAccount(['a'])
    load('a')
    expect(await peek(waitForWallets(account))).toBe(true)
  })

  it('waits for the last wallet, counting a failed one as done', async () => {
    const { account, load, fail, watcherCount } = makeAccount(['a', 'b'])
    const waiting = waitForWallets(account)

    load('a')
    expect(await peek(waiting)).toBe('pending')
    fail('b')
    expect(await peek(waiting)).toBe(true)
    expect(watcherCount()).toBe(0)
  })

  it('resolves false and unsubscribes when the account logs out', async () => {
    const { account, logout, watcherCount } = makeAccount(['a'])
    const waiting = waitForWallets(account)

    logout()
    expect(await peek(waiting)).toBe(false)
    expect(watcherCount()).toBe(0)
  })

  it('shares one set of watchers across links that arrive during a wait', async () => {
    const { account, load, watcherCount } = makeAccount(['a'])
    const first = waitForWallets(account)
    const second = waitForWallets(account)
    expect(watcherCount()).toBe(4)

    load('a')
    expect(await peek(first)).toBe(true)
    expect(await peek(second)).toBe(true)
  })
})

describe('launchDeepLink wallet wait', () => {
  it('follows only the latest link when several arrive during the wait', async () => {
    const watchers: Array<() => void> = []
    const account: any = {
      loggedIn: true,
      activeWalletIds: ['a'],
      currencyWallets: {},
      currencyWalletErrors: {},
      // No plugin for the linked asset, so the link degrades to no picker:
      currencyConfig: {},
      watch: (_prop: string, callback: () => void) => {
        watchers.push(callback)
        return () => {}
      }
    }
    const state: any = {
      core: { account, context: { clientId: '1111111111111111' } },
      ui: { settings: { defaultIsoFiat: 'iso:USD' } }
    }
    const dispatch: any = jest.fn()
    const navigation: any = { navigate: jest.fn() }
    const buyLink = (promoId: string): DeepLink => ({
      type: 'rampCreate',
      direction: 'buy',
      asset: { pluginId: 'nochain', tokenId: null },
      promoId
    })

    const first = launchDeepLink(navigation, buyLink('card1'))(
      dispatch,
      () => state
    )
    const second = launchDeepLink(navigation, buyLink('card2'))(
      dispatch,
      () => state
    )
    account.currencyWallets = { a: {} }
    for (const callback of [...watchers]) callback()

    expect(await first).toBe(false)
    expect(await second).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'LINK_PROMO/SET',
      data: { linkPromo: { promoId: 'card2', tab: 'buyTab' } }
    })
  })

  it('drops an exchange link that arrives while a picker is open', async () => {
    let pick: (result: any) => void = () => {}
    mockPickWallet.mockImplementationOnce(
      async () =>
        await new Promise(resolve => {
          pick = resolve
        })
    )
    const account: any = {
      loggedIn: true,
      activeWalletIds: ['a'],
      currencyWallets: { a: {} },
      currencyWalletErrors: {},
      currencyConfig: { bitcoin: { allTokens: {} } },
      watch: () => () => {}
    }
    const state: any = {
      core: { account, context: { clientId: '1111111111111111' } },
      ui: { settings: { defaultIsoFiat: 'iso:USD' } }
    }
    const dispatch: any = jest.fn()
    const navigation: any = { navigate: jest.fn() }
    const btcLink = (promoId: string): DeepLink => ({
      type: 'rampCreate',
      direction: 'buy',
      asset: { pluginId: 'bitcoin', tokenId: null },
      promoId
    })

    const first = launchDeepLink(navigation, btcLink('card1'))(
      dispatch,
      () => state
    )
    for (let i = 0; i < 20; i++) await Promise.resolve()
    const second = await launchDeepLink(navigation, btcLink('card2'))(
      dispatch,
      () => state
    )

    expect(second).toBe(false)
    expect(mockPickWallet).toHaveBeenCalledTimes(1)

    pick({ type: 'wallet', walletId: 'a', tokenId: null })
    expect(await first).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'LINK_PROMO/SET',
      data: { linkPromo: { promoId: 'card1', tab: 'buyTab' } }
    })
  })

  it('follows a walletConnect link that arrives while a picker is open', async () => {
    mockPickWallet.mockImplementationOnce(
      async () => await new Promise(() => {})
    )
    const account: any = {
      loggedIn: true,
      activeWalletIds: ['a'],
      currencyWallets: { a: {} },
      currencyWalletErrors: {},
      currencyConfig: { bitcoin: { allTokens: {} } },
      watch: () => () => {}
    }
    const state: any = {
      core: { account, context: { clientId: '1111111111111111' } },
      ui: { settings: { defaultIsoFiat: 'iso:USD' } }
    }
    const dispatch: any = jest.fn()
    const navigation: any = { navigate: jest.fn(), push: jest.fn() }

    // The exchange link's picker is up and never settles:
    launchDeepLink(navigation, buyLink)(dispatch, () => state).catch(() => {})
    for (let i = 0; i < 20; i++) await Promise.resolve()
    const picksWhileOpen = mockPickWallet.mock.calls.length

    // A link arriving from another app raises no picker of its own, and
    // `DeepLinkingManager` has already cleared its pending slot, so dropping
    // it would lose it:
    const followed = await launchDeepLink(navigation, {
      type: 'walletConnect',
      uri: 'wc:1@2?relay-protocol=irn'
    })(dispatch, () => state)

    expect(followed).toBe(true)
    expect(navigation.push).toHaveBeenCalledWith('wcConnections', {
      uri: 'wc:1@2?relay-protocol=irn'
    })
    expect(mockPickWallet.mock.calls.length).toBe(picksWhileOpen)
  })

  it('does not let a picker left open by one account block the next', async () => {
    mockPickWallet.mockImplementationOnce(
      async () => await new Promise(() => {})
    )
    mockPickWallet.mockImplementationOnce(async () => ({
      type: 'wallet',
      walletId: 'a',
      tokenId: null
    }))
    const makeState = (): any => ({
      core: {
        account: {
          loggedIn: true,
          activeWalletIds: ['a'],
          currencyWallets: { a: {} },
          currencyWalletErrors: {},
          currencyConfig: { bitcoin: { allTokens: {} } },
          watch: () => () => {}
        },
        context: { clientId: '1111111111111111' }
      },
      ui: { settings: { defaultIsoFiat: 'iso:USD' } }
    })
    const before = makeState()
    const after = makeState()
    const navigation: any = { navigate: jest.fn() }
    const link: DeepLink = {
      type: 'rampCreate',
      direction: 'buy',
      asset: { pluginId: 'bitcoin', tokenId: null }
    }

    // The first account's picker never settles, as when it logs out under it:
    launchDeepLink(navigation, link)(jest.fn() as any, () => before).catch(
      () => {}
    )
    for (let i = 0; i < 20; i++) await Promise.resolve()

    const followed = await launchDeepLink(navigation, link)(
      jest.fn() as any,
      () => after
    )
    expect(followed).toBe(true)
    expect(navigation.navigate).toHaveBeenCalledTimes(1)
  })
  it('drops an exchange link a marketing wrapper carries while a picker is open', async () => {
    mockPickWallet.mockImplementationOnce(
      async () => await new Promise(() => {})
    )
    const account: any = {
      loggedIn: true,
      activeWalletIds: ['a'],
      currencyWallets: { a: {} },
      currencyWalletErrors: {},
      currencyConfig: { bitcoin: { allTokens: {} } },
      watch: () => () => {}
    }
    const state: any = {
      core: { account, context: { clientId: '1111111111111111' } },
      ui: { settings: { defaultIsoFiat: 'iso:USD' } }
    }
    const dispatch: any = jest.fn()
    const navigation: any = { navigate: jest.fn() }
    const btcLink = (promoId: string): DeepLink => ({
      type: 'rampCreate',
      direction: 'buy',
      asset: { pluginId: 'bitcoin', tokenId: null },
      promoId
    })

    // The first link's picker is up and never settles:
    launchDeepLink(navigation, btcLink('card1'))(dispatch, () => state).catch(
      () => {}
    )
    for (let i = 0; i < 20; i++) await Promise.resolve()
    const picksWhileOpen = mockPickWallet.mock.calls.length

    // The wrapper hands the same exchange link to the same handler, so it has
    // to be dropped for the same reason a bare one is:
    const followed = await launchDeepLink(navigation, {
      type: 'marketing',
      campaignId: 'summer',
      link: btcLink('card2')
    })(dispatch, () => state)

    expect(followed).toBe(false)
    expect(mockPickWallet.mock.calls.length).toBe(picksWhileOpen)
    expect(navigation.navigate).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('drops an exchange link that names no asset while a picker is open', async () => {
    mockPickWallet.mockImplementationOnce(
      async () => await new Promise(() => {})
    )
    const account: any = {
      loggedIn: true,
      activeWalletIds: ['a'],
      currencyWallets: { a: {} },
      currencyWalletErrors: {},
      currencyConfig: { bitcoin: { allTokens: {} } },
      watch: () => () => {}
    }
    const state: any = {
      core: { account, context: { clientId: '1111111111111111' } },
      ui: { settings: { defaultIsoFiat: 'iso:USD' } }
    }
    const dispatch: any = jest.fn()
    const navigation: any = { navigate: jest.fn() }

    launchDeepLink(navigation, {
      type: 'rampCreate',
      direction: 'buy',
      asset: { pluginId: 'bitcoin', tokenId: null },
      promoId: 'card1'
    })(dispatch, () => state).catch(() => {})
    for (let i = 0; i < 20; i++) await Promise.resolve()

    // It raises no picker of its own, so it never waits for wallets, but it
    // would still overwrite the promo and the ramp params under the open one:
    const followed = await launchDeepLink(navigation, {
      type: 'rampCreate',
      direction: 'buy',
      promoId: 'card2'
    })(dispatch, () => state)

    expect(followed).toBe(false)
    expect(navigation.navigate).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('lets an exchange link that names no asset supersede one still waiting', async () => {
    const watchers: Array<() => void> = []
    const account: any = {
      loggedIn: true,
      activeWalletIds: ['a'],
      currencyWallets: {},
      currencyWalletErrors: {},
      currencyConfig: {},
      watch: (_prop: string, callback: () => void) => {
        watchers.push(callback)
        return () => {}
      }
    }
    const state: any = {
      core: { account, context: { clientId: '1111111111111111' } },
      ui: { settings: { defaultIsoFiat: 'iso:USD' } }
    }
    const dispatch: any = jest.fn()
    const navigation: any = { navigate: jest.fn() }

    const waiting = launchDeepLink(navigation, {
      type: 'rampCreate',
      direction: 'buy',
      asset: { pluginId: 'nochain', tokenId: null },
      promoId: 'card1'
    })(dispatch, () => state)

    // It needs no wallets, so it navigates while the first is still waiting:
    const direct = await launchDeepLink(navigation, {
      type: 'rampCreate',
      direction: 'buy',
      promoId: 'card2'
    })(dispatch, () => state)

    account.currencyWallets = { a: {} }
    for (const callback of [...watchers]) callback()

    expect(direct).toBe(true)
    expect(await waiting).toBe(false)
    expect(navigation.navigate).toHaveBeenCalledTimes(1)
    expect(dispatch).not.toHaveBeenCalledWith({
      type: 'LINK_PROMO/SET',
      data: { linkPromo: { promoId: 'card1', tab: 'buyTab' } }
    })
  })
})
