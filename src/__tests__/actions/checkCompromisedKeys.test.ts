import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import { checkCompromisedKeys } from '../../actions/WalletActions'

jest.mock('../../components/services/AirshipInstance', () => ({
  Airship: { show: jest.fn() },
  showError: jest.fn(),
  showToast: jest.fn()
}))

// The info server's answer, and a hook to change the file while it is
// being asked — which is the window the merge exists for.
let mockOnQuery: () => void = () => {}
jest.mock('../../util/network', () => ({
  ...jest.requireActual<object>('../../util/network'),
  fetchInfo: async () => {
    mockOnQuery()
    return {
      ok: true,
      json: async () => ({ docs: [] }),
      text: async () => ''
    }
  }
}))

/**
 * The call site the security-check merge was written for.
 *
 * `syncedSettingsTrust.test.ts` covers `markSecurityChecked` as a helper;
 * this runs `checkCompromisedKeys` itself. Writing its read-time copy of
 * `securityCheckedWallets` back whole — the regression the merge fixed —
 * replaced every other wallet's record, including a `modalShown` that keeps
 * the exposed-key modal from coming back.
 */
describe('checkCompromisedKeys', () => {
  it('records only the wallet it checked, merged into the file as it is now', async () => {
    let file = JSON.stringify({
      securityCheckedWallets: {
        other: { checked: false, modalShown: 2 }
      }
    })
    const account = {
      rootLoginId: 'root',
      activeWalletIds: ['w1'],
      currencyWallets: {
        w1: {
          id: 'w1',
          currencyInfo: { pluginId: 'bitcoin', walletType: 'wallet:bitcoin' },
          balanceMap: new Map([[null, '0']]),
          enabledTokenIds: []
        }
      },
      getDisplayPublicKey: async () => 'xpub-w1',
      disklet: {
        getText: async () => file,
        setText: async (path: string, text: string) => {
          if (path === 'Settings.json') file = text
        }
      }
    } as unknown as EdgeAccount
    // Another device records a third wallet while the server is asked.
    mockOnQuery = () => {
      const settings = JSON.parse(file)
      settings.securityCheckedWallets.third = { checked: true, modalShown: 0 }
      file = JSON.stringify(settings)
    }
    const dispatch = jest.fn()
    const getState = (): unknown => ({ core: { account } })
    await checkCompromisedKeys({} as any)(dispatch as any, getState as any)

    expect(JSON.parse(file).securityCheckedWallets).toStrictEqual({
      other: { checked: false, modalShown: 2 },
      third: { checked: true, modalShown: 0 },
      w1: { checked: true, modalShown: 0 }
    })
  })
})
