import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  LOCAL_SETTINGS_FILENAME,
  resetLocalAccountSettingsCache,
  toggleAccountBalanceVisibility
} from '../../actions/LocalSettingsActions'
import type { RootState } from '../../reducers/RootReducer'

jest.mock('../../components/services/AirshipInstance', () => ({
  showToast: jest.fn()
}))

describe('toggleAccountBalanceVisibility', () => {
  it('saves the final state when toggles overlap a logout', async () => {
    // Each write stays pending until the test releases it:
    const writes: Array<{ text: string; release: () => void }> = []
    let reads = 0
    const account = {
      localDisklet: {
        getText: async () => {
          ++reads
          return JSON.stringify({ isAccountBalanceVisible: true })
        },
        setText: async (path: string, text: string) => {
          expect(path).toBe(LOCAL_SETTINGS_FILENAME)
          await new Promise<void>(resolve => {
            writes.push({ text, release: resolve })
          })
        }
      }
    } as unknown as EdgeAccount

    let isAccountBalanceVisible = true
    const getState = (): RootState =>
      ({
        core: { account },
        ui: { settings: { isAccountBalanceVisible } }
      } as unknown as RootState)
    const dispatch = (action: any): void => {
      isAccountBalanceVisible = action.data.isAccountBalanceVisible
    }

    // Two quick taps: hide, then show again.
    const first = toggleAccountBalanceVisibility()(dispatch as any, getState)
    const second = toggleAccountBalanceVisibility()(dispatch as any, getState)
    expect(isAccountBalanceVisible).toBe(true)

    // The second save must not start until the first one finishes:
    await waitFor(() => writes.length === 1)
    await flush()
    expect(writes.length).toBe(1)

    // Logging out while saves are queued must not load this account's
    // settings back into the cache for the next account:
    resetLocalAccountSettingsCache()
    const readsAtLogout = reads
    writes[0].release()
    await first
    await waitFor(() => writes.length === 2)
    writes[1].release()
    await second

    const saved = JSON.parse(writes[writes.length - 1].text)
    expect(saved.isAccountBalanceVisible).toBe(true)
    expect(reads).toBe(readsAtLogout)
  })
})

async function flush(): Promise<void> {
  for (let i = 0; i < 20; ++i) await Promise.resolve()
}

async function waitFor(condition: () => boolean): Promise<void> {
  for (let i = 0; i < 100; ++i) {
    if (condition()) return
    await Promise.resolve()
  }
  throw new Error('Timed out')
}
