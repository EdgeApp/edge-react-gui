import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { walletListMenuAction } from '../../actions/WalletListMenuActions'
import type { RootState } from '../../reducers/RootReducer'
import type { Dispatch } from '../../types/reduxTypes'
import type { WalletsTabSceneProps } from '../../types/routerTypes'

const mockShowToast = jest.fn<(message: string) => void>()
const mockShowResyncWalletModal = jest.fn<(walletId: string) => string>()

jest.mock('../../components/services/AirshipInstance', () => ({
  Airship: { show: async () => undefined },
  showError: () => {},
  showToast: (message: string) => {
    mockShowToast(message)
  }
}))
jest.mock('../../actions/ResyncWalletModalActions', () => ({
  showResyncWalletModal: (walletId: string) =>
    mockShowResyncWalletModal(walletId)
}))

const WALLET_ID = 'wallet-id'

const mockResyncBlockchain = jest.fn<() => Promise<void>>()

const makeNavigation = (): WalletsTabSceneProps<
  'walletList' | 'walletDetails'
>['navigation'] =>
  // The resync action never navigates:
  ({} as unknown as WalletsTabSceneProps<
    'walletList' | 'walletDetails'
  >['navigation'])

const runResync = async (
  currencyInfo: { pluginId: string; evmChainId?: number },
  dispatch: Dispatch
): Promise<void> => {
  const wallet = {
    currencyInfo,
    name: 'My Wallet',
    resyncBlockchain: mockResyncBlockchain
  } as unknown as EdgeCurrencyWallet
  const state = {
    core: { account: { currencyWallets: { [WALLET_ID]: wallet } } }
  } as unknown as RootState

  await walletListMenuAction(
    makeNavigation(),
    WALLET_ID,
    'resync',
    null,
    []
  )(dispatch, () => state)
}

describe('walletListMenuAction resync', () => {
  const dispatch = jest.fn() as unknown as jest.MockedFunction<Dispatch>

  beforeEach(() => {
    jest.clearAllMocks()
    mockResyncBlockchain.mockResolvedValue(undefined)
    mockShowResyncWalletModal.mockReturnValue('show-modal-thunk')
  })

  it('resyncs an EVM wallet without confirmation and shows a toast', async () => {
    await runResync({ pluginId: 'binancesmartchain', evmChainId: 56 }, dispatch)

    expect(mockShowResyncWalletModal).not.toHaveBeenCalled()
    expect(mockResyncBlockchain).toHaveBeenCalledTimes(1)
    expect(mockShowToast).toHaveBeenCalledWith('Resyncing My Wallet')
  })

  it('shows no toast when an EVM resync rejects', async () => {
    const error = new Error('resync failed')
    mockResyncBlockchain.mockRejectedValue(error)

    await expect(
      runResync({ pluginId: 'ethereum', evmChainId: 1 }, dispatch)
    ).rejects.toBe(error)

    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('leaves a non-EVM wallet to the confirmation modal', async () => {
    await runResync({ pluginId: 'bitcoin' }, dispatch)

    expect(mockShowResyncWalletModal).toHaveBeenCalledWith(WALLET_ID)
    expect(dispatch).toHaveBeenCalledWith('show-modal-thunk')
    expect(mockResyncBlockchain).not.toHaveBeenCalled()
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('treats an EVM chain with no WalletConnect entry as EVM', async () => {
    await runResync({ pluginId: 'filecoinfevm', evmChainId: 314 }, dispatch)

    expect(mockShowResyncWalletModal).not.toHaveBeenCalled()
    expect(mockResyncBlockchain).toHaveBeenCalledTimes(1)
    expect(mockShowToast).toHaveBeenCalledWith('Resyncing My Wallet')
  })
})
