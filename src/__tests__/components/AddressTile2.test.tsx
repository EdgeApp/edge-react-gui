import { describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import type { EdgeAddress, EdgeCurrencyWallet } from 'edge-core-js'
import type * as EthersModule from 'ethers'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { Airship } from '../../components/services/AirshipInstance'
import {
  AddressTile2,
  type AddressTileRef,
  type ChangeAddressResult
} from '../../components/tiles/AddressTile2'
import { lstrings } from '../../locales/strings'
import type { EdgeAsset } from '../../types/types'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

// A plain address falls through to an ENS reverse lookup over the network:
jest.mock('../../util/nameServices', () => ({
  ...jest.requireActual<object>('../../util/nameServices'),
  reverseLookupName: async () => null
}))

// A FIO handle can resolve to an ENS name, which resolves over the network:
const mockEnsNames: Record<string, string> = {}
jest.mock('ethers', () => {
  const actual = jest.requireActual<typeof EthersModule>('ethers')
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      getDefaultProvider: () => ({
        resolveName: async (name: string) => mockEnsNames[name] ?? null
      })
    }
  }
})

const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const ethConfig = makeFakeCurrencyConfig(ethCurrencyInfo)

const makeWallet = (
  id: string,
  getAddresses: EdgeCurrencyWallet['getAddresses']
): EdgeCurrencyWallet =>
  ({
    currencyConfig: ethConfig,
    currencyInfo: ethConfig.currencyInfo,
    enabledTokenIds: [USDC_TOKEN_ID],
    getAddresses,
    id,
    type: ethConfig.currencyInfo.walletType,
    watch: () => () => {}
  } as unknown as EdgeCurrencyWallet)

describe('AddressTile2 "Myself" picker', () => {
  it("asks a picked token row for the token's own receive address", async () => {
    const tokenAddress: EdgeAddress = {
      addressType: 'publicAddress',
      publicAddress: '0x00000000000000000000000000000000000000aa'
    }
    const getAddresses = jest.fn<EdgeCurrencyWallet['getAddresses']>(
      async () => [tokenAddress]
    )
    const sourceWallet = makeWallet('source', async () => [])
    const pickedWallet = makeWallet('picked', getAddresses)
    const onPickAsset = jest.fn<
      (
        asset: EdgeAsset,
        address: string,
        walletAddresses: EdgeAddress[]
      ) => Promise<boolean>
    >(async () => true)
    const showSpy = jest.spyOn(Airship, 'show').mockResolvedValue({
      type: 'wallet',
      walletId: 'picked',
      tokenId: USDC_TOKEN_ID
    })

    const rootState: FakeState = {
      core: {
        account: {
          currencyConfig: { ethereum: ethConfig },
          currencyWallets: { source: sourceWallet, picked: pickedWallet },
          watch: () => () => {}
        }
      }
    }
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <AddressTile2
          coreWallet={sourceWallet}
          tokenId={null}
          title="Send to"
          recipientAddress=""
          onChangeAddress={async () => {}}
          resetSendTransaction={() => {}}
          isCameraOpen={false}
          navigation={fakeNavigation}
          selfTransfer={{
            allowedAssets: [
              { pluginId: 'ethereum', tokenId: null },
              { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID }
            ],
            onPickAsset
          }}
        />
      </FakeProviders>
    )

    fireEvent.press(rendered.getByTestId('addressTileMyself'))
    await waitFor(() => {
      expect(onPickAsset).toHaveBeenCalledWith(
        { pluginId: 'ethereum', tokenId: USDC_TOKEN_ID },
        tokenAddress.publicAddress,
        [tokenAddress]
      )
    })
    expect(getAddresses).toHaveBeenCalledWith({ tokenId: USDC_TOKEN_ID })

    showSpy.mockRestore()
    rendered.unmount()
  })
})

describe('AddressTile2 FIO address warning', () => {
  const HANDLE = 'bc1qdeposit@thorchain'
  const DEPOSIT = 'osmo1qxyzv9lcmrsxyhk8zwfm5snntmqz5r3g7xyzab'
  const DEPOSIT_HANDLE = `${DEPOSIT}@solibc`
  const RESOLVED_ADDRESS = '0x00000000000000000000000000000000000000bb'
  const ENS_NAME = 'payee.eth'
  const ENS_ADDRESS = '0x00000000000000000000000000000000000000dd'
  mockEnsNames[ENS_NAME] = ENS_ADDRESS

  interface EnterOptions {
    approved?: boolean
    cache?: Record<string, boolean>
    input?: string
    ownHandles?: string[]
    resolves?: boolean
    resolvesTo?: string
    sent?: Record<string, string[]>
  }

  const enterAddress = async (
    options: EnterOptions
  ): Promise<{
    onChangeAddress: jest.Mock<(result: ChangeAddressResult) => Promise<void>>
    warnings: number
    warningText: string[]
  }> => {
    const {
      approved = true,
      cache = {},
      input = HANDLE,
      ownHandles = [],
      resolves = true,
      resolvesTo = RESOLVED_ADDRESS,
      sent = {}
    } = options

    const wallet = {
      ...makeWallet('source', async () => []),
      parseUri: async (text: string) => ({ publicAddress: text })
    } as unknown as EdgeCurrencyWallet
    const fioConfig = {
      currencyInfo: {
        defaultSettings: { errorCodes: { INVALID_FIO_ADDRESS: 'INVALID' } }
      },
      otherMethods: {
        getConnectedPublicAddress: async () => {
          if (resolves) return { public_address: resolvesTo }
          const error: Error & { code?: string; labelCode?: string } =
            new Error('invalid')
          error.labelCode = 'INVALID'
          error.code = 'INVALID'
          throw error
        }
      }
    }
    const onChangeAddress = jest.fn<
      (result: ChangeAddressResult) => Promise<void>
    >(async () => {})
    const showSpy = jest.spyOn(Airship, 'show').mockResolvedValue(approved)

    const rootState: FakeState = {
      core: {
        account: {
          currencyConfig: { ethereum: ethConfig, fio: fioConfig },
          currencyWallets: { source: wallet },
          disklet: {
            getText: async (path: string) =>
              JSON.stringify({
                addresses: path === 'FioSentAddresses.json' ? sent : cache
              })
          },
          watch: () => () => {}
        }
      },
      ui: {
        fioAddress: {
          fioAddresses: ownHandles.map(name => ({
            name,
            bundledTxs: 0,
            walletId: 'fio'
          }))
        }
      }
    } as unknown as FakeState

    const ref = React.createRef<AddressTileRef>()
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <AddressTile2
          ref={ref}
          coreWallet={wallet}
          tokenId={null}
          title="Send to"
          recipientAddress=""
          onChangeAddress={onChangeAddress}
          resetSendTransaction={() => {}}
          isCameraOpen={false}
          navigation={fakeNavigation}
        />
      </FakeProviders>
    )
    await act(async () => {
      await ref.current?.onChangeAddress(input)
    })
    rendered.unmount()

    const warningModals = showSpy.mock.calls
      .map(
        ([renderModal]) =>
          renderModal(null as never) as React.ReactElement<{
            body?: string
            children?: React.ReactNode
            title?: string
          }>
      )
      .filter(
        modal =>
          modal.props.title === lstrings.warning_sending_to_fio_address_title
      )
    showSpy.mockRestore()
    return {
      onChangeAddress,
      warnings: warningModals.length,
      warningText: warningModals.map(modal =>
        [collectText(modal.props.children), modal.props.body].join('\n')
      )
    }
  }

  it('warns for a handle this account has never interacted with', async () => {
    const { onChangeAddress, warnings } = await enterAddress({})
    expect(warnings).toBe(1)
    expect(onChangeAddress).toHaveBeenCalledTimes(1)
    expect(onChangeAddress.mock.calls[0][0]).toMatchObject({
      fioAddress: HANDLE,
      acceptedName: {
        service: 'fio',
        name: HANDLE,
        publicAddress: RESOLVED_ADDRESS
      },
      parsedUri: { publicAddress: RESOLVED_ADDRESS }
    })
  })

  it('names the coin, the resolved address, and the address the handle copies', async () => {
    const { warningText } = await enterAddress({ input: DEPOSIT_HANDLE })
    expect(warningText).toHaveLength(1)
    expect(warningText[0]).toContain(
      sprintf(
        lstrings.warning_sending_to_fio_address_resolves_3s,
        DEPOSIT_HANDLE,
        'ETH',
        RESOLVED_ADDRESS
      )
    )
    expect(warningText[0]).toContain(
      sprintf(lstrings.warning_sending_to_fio_address_not_name_1s, DEPOSIT)
    )
    expect(warningText[0]).toContain(
      lstrings.warning_sending_to_fio_address_owner
    )
  })

  it('leaves out the "will not go to" sentence for a plain name', async () => {
    const { warningText } = await enterAddress({ input: 'alice@edge' })
    expect(warningText).toHaveLength(1)
    expect(warningText[0]).toContain(
      lstrings.warning_sending_to_fio_address_no_routing
    )
    expect(warningText[0]).not.toContain(
      sprintf(lstrings.warning_sending_to_fio_address_not_name_1s, 'alice')
    )
  })

  it('keeps the recipient unset when the warning is declined', async () => {
    const { onChangeAddress, warnings } = await enterAddress({
      approved: false
    })
    expect(warnings).toBe(1)
    expect(onChangeAddress).not.toHaveBeenCalled()
  })

  it('skips the warning for a handle this account sent to, ignoring case', async () => {
    const { onChangeAddress, warnings } = await enterAddress({
      input: 'BC1QDeposit@thorchain',
      sent: { [HANDLE]: [RESOLVED_ADDRESS] }
    })
    expect(warnings).toBe(0)
    expect(onChangeAddress).toHaveBeenCalledTimes(1)
  })

  it('warns for a sent-to handle that now resolves to another address', async () => {
    const { warnings } = await enterAddress({
      sent: { [HANDLE]: ['0x00000000000000000000000000000000000000cc'] }
    })
    expect(warnings).toBe(1)
  })

  it('accepts and shows the address an ENS name from the handle points to', async () => {
    const { onChangeAddress, warningText } = await enterAddress({
      resolvesTo: ENS_NAME
    })
    expect(warningText).toHaveLength(1)
    expect(warningText[0]).toContain(
      sprintf(
        lstrings.warning_sending_to_fio_address_resolves_3s,
        HANDLE,
        'ETH',
        ENS_ADDRESS
      )
    )
    expect(onChangeAddress.mock.calls[0][0]).toMatchObject({
      fioAddress: HANDLE,
      acceptedName: {
        service: 'fio',
        name: HANDLE,
        publicAddress: ENS_ADDRESS
      },
      parsedUri: { publicAddress: ENS_ADDRESS }
    })
  })

  it('warns once the ENS name from a sent-to handle points elsewhere', async () => {
    const { warnings } = await enterAddress({
      resolvesTo: ENS_NAME,
      sent: { [HANDLE]: [ENS_NAME, RESOLVED_ADDRESS] }
    })
    expect(warnings).toBe(1)
  })

  it('skips the warning when the ENS name still points to the sent address', async () => {
    const { warnings } = await enterAddress({
      resolvesTo: ENS_NAME,
      sent: { [HANDLE]: [ENS_ADDRESS] }
    })
    expect(warnings).toBe(0)
  })

  it('warns for a handle that only came from an incoming request', async () => {
    const { warnings } = await enterAddress({ cache: { [HANDLE]: true } })
    expect(warnings).toBe(1)
  })

  it("skips the warning for the account's own handle", async () => {
    const { onChangeAddress, warnings } = await enterAddress({
      ownHandles: ['BC1QDeposit@thorchain']
    })
    expect(warnings).toBe(0)
    expect(onChangeAddress).toHaveBeenCalledTimes(1)
  })

  it.each(['bc1qdeposit@other', 'someoneelse@thorchain'])(
    'warns for %s when only a different own handle matches part of it',
    async input => {
      const { warnings } = await enterAddress({
        input,
        ownHandles: ['BC1QDeposit@thorchain']
      })
      expect(warnings).toBe(1)
    }
  )

  it('does not warn for input that is not a FIO handle', async () => {
    const { onChangeAddress, warnings } = await enterAddress({
      input: RESOLVED_ADDRESS,
      resolves: false
    })
    expect(warnings).toBe(0)
    expect(onChangeAddress).toHaveBeenCalledTimes(1)
  })
})

/** Joins the text of every string under a React element tree. */
const collectText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(collectText).join('\n')
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return collectText(node.props.children)
  }
  return ''
}
