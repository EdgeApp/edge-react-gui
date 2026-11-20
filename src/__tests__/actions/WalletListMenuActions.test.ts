import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Linking } from 'react-native'

import { walletListMenuAction } from '../../actions/WalletListMenuActions'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

const WALLET_ID = 'wallet-1'
const openUrlSpy = jest.spyOn(Linking, 'openURL')

async function viewInExplorer(
  addresses: Array<{ publicAddress: string }>,
  currencyInfo: { pluginId: string; addressExplorer: string } = {
    pluginId: 'bitcoin',
    addressExplorer: 'https://explorer.example/address/%s'
  }
): Promise<void> {
  const getState: any = () => ({
    core: {
      account: {
        currencyWallets: {
          [WALLET_ID]: {
            currencyInfo,
            getAddresses: async () => addresses
          }
        }
      }
    }
  })
  const thunk = walletListMenuAction(
    fakeNavigation as any,
    WALLET_ID,
    'viewInExplorer',
    null,
    []
  )
  await thunk(jest.fn() as any, getState)
}

const HEDERA_INFO = {
  pluginId: 'hedera',
  addressExplorer: 'https://hashscan.io/mainnet/account/%s'
}

describe('walletListMenuAction viewInExplorer', () => {
  const showSpy = jest.spyOn(Airship, 'show')

  beforeEach(() => {
    openUrlSpy.mockReset()
    openUrlSpy.mockResolvedValue(undefined)
    showSpy.mockReset()
    showSpy.mockResolvedValue(undefined)
  })

  it('opens the first address, the one the Receive scene shows', async () => {
    await viewInExplorer([
      { publicAddress: 'first' },
      { publicAddress: 'second' }
    ])
    expect(openUrlSpy).toHaveBeenCalledTimes(1)
    expect(openUrlSpy).toHaveBeenCalledWith(
      'https://explorer.example/address/first'
    )
  })

  it('errors rather than opening a bare explorer URL', async () => {
    const message = lstrings.wallet_menu_explorer_no_address_error
    await expect(viewInExplorer([{ publicAddress: '' }])).rejects.toThrow(
      message
    )
    await expect(viewInExplorer([])).rejects.toThrow(message)
    expect(openUrlSpy).not.toHaveBeenCalled()
  })

  it('explains instead of opening Hashscan for an uncreated Hedera account', async () => {
    // QA C3: an unfunded wallet reports `0.0.<public key>`, which Hashscan
    // rejects as "Invalid account ID, address or alias".
    await viewInExplorer(
      [{ publicAddress: '0.0.302a300506032b65700321008c855c0be9a9189ce3' }],
      HEDERA_INFO
    )
    expect(showSpy).toHaveBeenCalledTimes(1)
    expect(openUrlSpy).not.toHaveBeenCalled()
  })

  it('opens Hashscan once the Hedera account has a numeric id', async () => {
    await viewInExplorer([{ publicAddress: '0.0.12345' }], HEDERA_INFO)
    expect(showSpy).not.toHaveBeenCalled()
    expect(openUrlSpy).toHaveBeenCalledWith(
      'https://hashscan.io/mainnet/account/0.0.12345'
    )
  })
})
