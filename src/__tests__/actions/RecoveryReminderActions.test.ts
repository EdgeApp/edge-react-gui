import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { checkPasswordRecovery } from '../../actions/RecoveryReminderActions'
import type { PasswordReminderLevels } from '../../actions/SettingsActions'
import type { RootState } from '../../reducers/RootReducer'
import type { Action, Dispatch } from '../../types/reduxTypes'

// Provide a virtual env.json so importing env.ts does not fail:
jest.mock('../../../env.json', () => ({}), { virtual: true })

const mockShowModal = jest.fn()
const mockWriteReminders =
  jest.fn<(account: EdgeAccount, levels: string[]) => void>()

jest.mock('../../components/services/AirshipInstance', () => ({
  Airship: {
    show: async () => {
      mockShowModal()
      return 'cancel'
    }
  },
  showError: () => {}
}))
jest.mock('../../components/modals/ButtonsModal', () => ({
  ButtonsModal: () => null
}))
jest.mock('../../actions/SettingsActions', () => ({
  writePasswordRecoveryReminders: async (
    account: EdgeAccount,
    levels: string[]
  ) => {
    mockWriteReminders(account, levels)
  }
}))

type Navigation = Parameters<typeof checkPasswordRecovery>[0]
const navigation = {
  push: () => {}
} as unknown as Navigation

const noneShown: PasswordReminderLevels = {
  '20': false,
  '200': false,
  '2000': false,
  '20000': false,
  '200000': false
}

/**
 * A one-wallet account holding `btc` BTC, plus an optional balance of an
 * unpriced token the rates server knows nothing about.
 */
const makeWallet = (btc: string, tokenBalance?: string): EdgeCurrencyWallet => {
  const balanceMap = new Map<string | null, string>([[null, btc]])
  if (tokenBalance != null) balanceMap.set('unknown-token', tokenBalance)

  return {
    id: 'wallet-1',
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      denominations: [{ name: 'BTC', multiplier: '100000000' }]
    },
    currencyConfig: {
      allTokens: {
        'unknown-token': {
          currencyCode: 'UNKNOWN',
          denominations: [{ name: 'UNKNOWN', multiplier: '100000000' }]
        }
      }
    },
    balanceMap
  } as unknown as EdgeCurrencyWallet
}

/**
 * A wallet on a chain the rates server never prices, e.g. a testnet coin.
 */
const makeUnpricedWallet = (balance: string): EdgeCurrencyWallet =>
  ({
    id: 'wallet-2',
    currencyInfo: {
      pluginId: 'bitcointestnet',
      currencyCode: 'TESTBTC',
      denominations: [{ name: 'TESTBTC', multiplier: '100000000' }]
    },
    currencyConfig: { allTokens: {} },
    balanceMap: new Map([[null, balance]])
  } as unknown as EdgeCurrencyWallet)

interface StateOptions {
  balance?: string
  hasRate?: boolean
  recoveryKey?: string
  remindersShown?: Partial<PasswordReminderLevels>
  tokenBalance?: string
  unpricedBalance?: string
  username?: string | null
}

const makeState = (opts: StateOptions = {}): RootState => {
  const {
    balance = '0',
    hasRate = true,
    recoveryKey,
    remindersShown = {},
    tokenBalance,
    unpricedBalance,
    username = 'test-user'
  } = opts

  const account = {
    recoveryKey,
    username,
    currencyWallets: {
      'wallet-1': makeWallet(balance, tokenBalance),
      ...(unpricedBalance == null
        ? {}
        : { 'wallet-2': makeUnpricedWallet(unpricedBalance) })
    }
  } as unknown as EdgeAccount

  return {
    core: { account },
    exchangeRates: {
      crypto: hasRate
        ? { bitcoin: { '': { 'iso:USD': { current: 100000 } } } }
        : {},
      fiat: {}
    },
    ui: {
      settings: {
        passwordRecoveryRemindersShown: { ...noneShown, ...remindersShown }
      }
    }
  } as unknown as RootState
}

/**
 * Run the thunk and report what it dispatched and wrote.
 */
const run = async (
  state: RootState
): Promise<{ levels: string[]; modalShown: boolean }> => {
  const actions: Action[] = []
  const dispatch = ((action: Action) => {
    actions.push(action)
    return action
  }) as Dispatch

  checkPasswordRecovery(navigation)(dispatch, () => state)
  // Let the modal promise settle:
  await Promise.resolve()

  const levels = actions
    .filter(
      action => action.type === 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL'
    )
    .map(action => String((action as { data: string }).data))

  return { levels, modalShown: mockShowModal.mock.calls.length > 0 }
}

describe('checkPasswordRecovery', () => {
  beforeEach(() => {
    mockShowModal.mockClear()
    mockWriteReminders.mockClear()
  })

  it('does nothing below the lowest level', async () => {
    // 0.0001 BTC at $100k = $10:
    const { levels, modalShown } = await run(makeState({ balance: '10000' }))
    expect(levels).toEqual([])
    expect(modalShown).toBe(false)
  })

  it('shows the reminder once the balance crosses $20', async () => {
    // 0.0005 BTC at $100k = $50:
    const { levels, modalShown } = await run(makeState({ balance: '50000' }))
    expect(levels).toEqual(['20'])
    expect(modalShown).toBe(true)
    expect(mockWriteReminders).toHaveBeenCalledWith(expect.anything(), ['20'])
  })

  it('marks every crossed level but shows one modal', async () => {
    // 0.005 BTC at $100k = $500, which passes both $20 and $200:
    const { levels, modalShown } = await run(makeState({ balance: '500000' }))
    expect(levels).toEqual(['20', '200'])
    expect(mockShowModal).toHaveBeenCalledTimes(1)
    expect(modalShown).toBe(true)
  })

  it('skips levels that were already shown', async () => {
    const { levels, modalShown } = await run(
      makeState({ balance: '500000', remindersShown: { '20': true } })
    )
    expect(levels).toEqual(['200'])
    expect(modalShown).toBe(true)
  })

  it('does nothing when every crossed level was shown', async () => {
    const { levels, modalShown } = await run(
      makeState({
        balance: '500000',
        remindersShown: { '20': true, '200': true }
      })
    )
    expect(levels).toEqual([])
    expect(modalShown).toBe(false)
  })

  it('waits when a funded wallet has no exchange rate yet', async () => {
    const { levels, modalShown } = await run(
      makeState({ balance: '500000', hasRate: false })
    )
    expect(levels).toEqual([])
    expect(modalShown).toBe(false)
  })

  it('is not blocked by a token the rates server does not price', async () => {
    // The token never gets a rate, so waiting on one would suppress the
    // reminder forever. The native BTC rate is what gates the check:
    const { levels, modalShown } = await run(
      makeState({ balance: '500000', tokenBalance: '1000000' })
    )
    expect(levels).toEqual(['20', '200'])
    expect(modalShown).toBe(true)
  })

  it('waits for a wallet whose rate has not loaded yet', async () => {
    const { levels, modalShown } = await run(
      makeState({ balance: '500000', unpricedBalance: '100000' })
    )
    expect(levels).toEqual([])
    expect(modalShown).toBe(false)
  })

  it('stops waiting for a rate that is never coming', async () => {
    // Five minutes into the login session, a wallet with no rate is one the
    // rates server does not price. Deferring past that would suppress the
    // reminder forever. The window starts at this account's first check, so
    // run once to open it, then let the clock run out:
    const state = makeState({ balance: '500000', unpricedBalance: '100000' })
    const opening = await run(state)
    expect(opening.levels).toEqual([])

    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 6 * 60 * 1000)
    try {
      const { levels, modalShown } = await run(state)
      expect(levels).toEqual(['20', '200'])
      expect(modalShown).toBe(true)
    } finally {
      nowSpy.mockRestore()
    }
  })

  it('gives each account its own grace window', async () => {
    // A second login later in the same session must not inherit an expired
    // window from the first account:
    const first = makeState({ balance: '500000', unpricedBalance: '100000' })
    await run(first)

    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 6 * 60 * 1000)
    try {
      const second = makeState({ balance: '500000', unpricedBalance: '100000' })
      const { levels, modalShown } = await run(second)
      expect(levels).toEqual([])
      expect(modalShown).toBe(false)
    } finally {
      nowSpy.mockRestore()
    }
  })

  it('skips accounts that already have recovery set up', async () => {
    const { levels, modalShown } = await run(
      makeState({ balance: '500000', recoveryKey: 'abcd' })
    )
    expect(levels).toEqual([])
    expect(modalShown).toBe(false)
  })

  it('skips light accounts', async () => {
    const { levels, modalShown } = await run(
      makeState({ balance: '500000', username: null })
    )
    expect(levels).toEqual([])
    expect(modalShown).toBe(false)
  })
})
