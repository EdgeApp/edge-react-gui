import { describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import type { EdgeAddress, EdgeCurrencyWallet } from 'edge-core-js'
import type * as EthersModule from 'ethers'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import {
  AddressModal,
  type AddressModalResult
} from '../../components/modals/AddressModal'
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

// ZcashNames resolve over the network:
const mockZnsNames: Record<string, string> = {}
jest.mock('../../util/zns', () => ({
  ...jest.requireActual<object>('../../util/zns'),
  resolveZnsName: async (name: string) =>
    mockZnsNames[name.toLowerCase()] ?? null
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

describe('AddressTile2 name warning', () => {
  const HANDLE = 'bc1qdeposit@thorchain'
  const RESOLVED_ADDRESS = '0x00000000000000000000000000000000000000bb'
  const ENS_NAME = 'payee.eth'
  const ENS_ADDRESS = '0x00000000000000000000000000000000000000dd'
  const UD_NAME = 'alice.wallet'
  const UD_ADDRESS = '0x00000000000000000000000000000000000000ee'
  const ZANO_ALIAS = '@alice'
  const ZANO_ADDRESS = 'ZxZanoAddressForAlice'
  const ZNS_NAME = 'alice.zcash'
  const ZNS_ADDRESS = 'u1zcashaddressforalice'
  mockEnsNames[ENS_NAME] = ENS_ADDRESS
  mockZnsNames[ZNS_NAME] = ZNS_ADDRESS

  interface EnterOptions {
    approved?: boolean
    cache?: Record<string, boolean>
    input?: string
    /** Picked in the address modal instead of entered through the ref. */
    modalResult?: AddressModalResult
    ownHandles?: string[]
    pluginId?: string
    resolves?: boolean
    resolvesTo?: string
    /** The FIO-only list older versions wrote. */
    sent?: Record<string, string[]>
    sentNames?: Record<string, Record<string, string[]>>
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
      modalResult,
      ownHandles = [],
      pluginId = 'ethereum',
      resolves = true,
      resolvesTo = RESOLVED_ADDRESS,
      sent = {},
      sentNames = {}
    } = options

    const wallet = {
      ...makeWallet('source', async () => []),
      currencyInfo: { ...ethConfig.currencyInfo, pluginId },
      otherMethods: {
        resolveName: async (name: string) =>
          name === ZANO_ALIAS ? ZANO_ADDRESS : undefined
      },
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
    const showSpy = jest
      .spyOn(Airship, 'show')
      .mockImplementation(async renderModal => {
        const modal = renderModal(null as never) as React.ReactElement
        return modal.type === AddressModal ? modalResult : approved
      })

    const rootState: FakeState = {
      core: {
        account: {
          currencyConfig: { ethereum: ethConfig, fio: fioConfig },
          currencyWallets: { source: wallet },
          disklet: {
            getText: async (path: string) => {
              if (path === 'SentNames.json') {
                return JSON.stringify({ names: sentNames })
              }
              return JSON.stringify({
                addresses: path === 'FioSentAddresses.json' ? sent : cache
              })
            }
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
    if (modalResult != null) {
      fireEvent.press(rendered.getByTestId('addressTileEnter'))
      await waitFor(() => {
        expect(onChangeAddress).toHaveBeenCalled()
      })
    } else {
      await act(async () => {
        await ref.current?.onChangeAddress(input)
      })
    }
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
        modal => modal.props.title === lstrings.warning_sending_to_name_title
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

  describe('FIO handles', () => {
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

    it('names the name, its service, the coin, and the resolved address', async () => {
      const { warningText } = await enterAddress({})
      expect(warningText).toHaveLength(1)
      expect(warningText[0]).toContain(
        sprintf(
          lstrings.warning_sending_to_name_resolves_4s,
          HANDLE,
          'FIO',
          'ETH',
          RESOLVED_ADDRESS
        )
      )
      expect(warningText[0]).toContain(
        lstrings.warning_sending_to_name_no_routing
      )
      expect(warningText[0]).toContain(lstrings.warning_sending_to_name_owner)
    })

    it('keeps the recipient unset when the warning is declined', async () => {
      const { onChangeAddress, warnings } = await enterAddress({
        approved: false
      })
      expect(warnings).toBe(1)
      expect(onChangeAddress).not.toHaveBeenCalled()
    })

    it('skips the warning for a handle in the older FIO-only list, ignoring case', async () => {
      const { onChangeAddress, warnings } = await enterAddress({
        input: 'BC1QDeposit@thorchain',
        sent: { [HANDLE]: [RESOLVED_ADDRESS] }
      })
      expect(warnings).toBe(0)
      expect(onChangeAddress).toHaveBeenCalledTimes(1)
    })

    it('skips the warning for a handle in the sent names list', async () => {
      const { warnings } = await enterAddress({
        sentNames: { fio: { [HANDLE]: [RESOLVED_ADDRESS] } }
      })
      expect(warnings).toBe(0)
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
          lstrings.warning_sending_to_name_resolves_4s,
          HANDLE,
          'FIO',
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
  })

  describe('other name services', () => {
    it('warns for an ENS name typed into the tile', async () => {
      const { onChangeAddress, warningText } = await enterAddress({
        input: ENS_NAME,
        resolves: false
      })
      expect(warningText).toHaveLength(1)
      expect(warningText[0]).toContain(
        sprintf(
          lstrings.warning_sending_to_name_resolves_4s,
          ENS_NAME,
          'ENS',
          'ETH',
          ENS_ADDRESS
        )
      )
      expect(onChangeAddress.mock.calls[0][0]).toMatchObject({
        acceptedName: {
          service: 'ens',
          name: ENS_NAME,
          publicAddress: ENS_ADDRESS
        },
        parsedUri: { publicAddress: ENS_ADDRESS },
        resolvedName: { name: ENS_NAME, service: 'ens' }
      })
    })

    it('skips the warning for an ENS name this account sent to', async () => {
      const { warnings } = await enterAddress({
        input: ENS_NAME,
        resolves: false,
        sentNames: { ens: { [ENS_NAME]: [ENS_ADDRESS] } }
      })
      expect(warnings).toBe(0)
    })

    it('warns for an Unstoppable Domains name the address modal resolved', async () => {
      const { onChangeAddress, warningText } = await enterAddress({
        modalResult: {
          address: UD_ADDRESS,
          name: { service: 'unstoppable', name: UD_NAME }
        },
        resolves: false
      })
      expect(warningText).toHaveLength(1)
      expect(warningText[0]).toContain(
        sprintf(
          lstrings.warning_sending_to_name_resolves_4s,
          UD_NAME,
          'Unstoppable Domains',
          'ETH',
          UD_ADDRESS
        )
      )
      expect(onChangeAddress.mock.calls[0][0]).toMatchObject({
        acceptedName: {
          service: 'unstoppable',
          name: UD_NAME,
          publicAddress: UD_ADDRESS
        },
        parsedUri: { publicAddress: UD_ADDRESS },
        resolvedName: { name: UD_NAME, service: 'unstoppable' }
      })
    })

    it('skips the warning for a modal name this account sent to', async () => {
      const { onChangeAddress, warnings } = await enterAddress({
        modalResult: {
          address: UD_ADDRESS,
          name: { service: 'unstoppable', name: UD_NAME }
        },
        resolves: false,
        sentNames: { unstoppable: { [UD_NAME]: [UD_ADDRESS] } }
      })
      expect(warnings).toBe(0)
      expect(onChangeAddress).toHaveBeenCalledTimes(1)
    })

    it('does not warn for an address picked in the modal', async () => {
      const { onChangeAddress, warnings } = await enterAddress({
        modalResult: { address: UD_ADDRESS },
        resolves: false
      })
      expect(warnings).toBe(0)
      expect(onChangeAddress.mock.calls[0][0].acceptedName).toBeUndefined()
    })

    it('warns for a Zano alias', async () => {
      const { onChangeAddress, warningText } = await enterAddress({
        input: ZANO_ALIAS,
        pluginId: 'zano',
        resolves: false
      })
      expect(warningText).toHaveLength(1)
      expect(warningText[0]).toContain(
        sprintf(
          lstrings.warning_sending_to_name_resolves_4s,
          ZANO_ALIAS,
          'Zano',
          'ETH',
          ZANO_ADDRESS
        )
      )
      expect(onChangeAddress.mock.calls[0][0]).toMatchObject({
        acceptedName: {
          service: 'zano',
          name: ZANO_ALIAS,
          publicAddress: ZANO_ADDRESS
        },
        alias: ZANO_ALIAS
      })
    })

    it('warns for a ZcashNames name', async () => {
      const { onChangeAddress, warningText } = await enterAddress({
        input: 'Alice.zcash',
        pluginId: 'zcash',
        resolves: false
      })
      expect(warningText).toHaveLength(1)
      expect(warningText[0]).toContain(
        sprintf(
          lstrings.warning_sending_to_name_resolves_4s,
          ZNS_NAME,
          'ZcashNames',
          'ETH',
          ZNS_ADDRESS
        )
      )
      expect(onChangeAddress.mock.calls[0][0]).toMatchObject({
        acceptedName: {
          service: 'zns',
          name: ZNS_NAME,
          publicAddress: ZNS_ADDRESS
        }
      })
    })

    it('does not warn for input that is not a name', async () => {
      const { onChangeAddress, warnings } = await enterAddress({
        input: RESOLVED_ADDRESS,
        resolves: false
      })
      expect(warnings).toBe(0)
      expect(onChangeAddress).toHaveBeenCalledTimes(1)
      expect(onChangeAddress.mock.calls[0][0].acceptedName).toBeUndefined()
    })
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
