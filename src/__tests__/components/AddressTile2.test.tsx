import { describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import type {
  EdgeAddress,
  EdgeCurrencyWallet,
  EdgeMetadata
} from 'edge-core-js'
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

describe('AddressTile2 cross-chain address', () => {
  const PAYEE = '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
  // Parsers flag a gateway code on the metadata, outside the core type:
  const gatewayMetadata: EdgeMetadata & { gateway: boolean } = {
    gateway: true
  }

  const renderCrossChainTile = (
    onChangeAddress: (result: ChangeAddressResult) => Promise<void>
  ): {
    ref: React.RefObject<AddressTileRef | null>
    unmount: () => void
  } => {
    const wallet = makeWallet('source', async () => [])
    const ref = React.createRef<AddressTileRef>()
    const rootState: FakeState = {
      core: {
        account: {
          currencyConfig: { ethereum: ethConfig },
          currencyWallets: { source: wallet },
          watch: () => () => {}
        }
      }
    }
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
          parseCrossChainAddress={async () => ({
            publicAddress: PAYEE,
            currencyCode: 'USDT',
            metadata: gatewayMetadata
          })}
        />
      </FakeProviders>
    )
    return { ref, unmount: rendered.unmount }
  }

  const answerModals = (
    answer: boolean
  ): { titles: unknown[]; restore: () => void } => {
    const titles: unknown[] = []
    const spy = jest
      .spyOn(Airship, 'show')
      .mockImplementation(
        async (renderModal: (bridge: never) => React.ReactNode) => {
          const modal = renderModal(undefined as never) as React.ReactElement<{
            title?: string
          }>
          titles.push(modal.props.title)
          return answer
        }
      )
    return {
      titles,
      restore: () => {
        spy.mockRestore()
      }
    }
  }

  it("keeps a gateway code out when the payout's warning is declined", async () => {
    const onChangeAddress = jest.fn(async (result: ChangeAddressResult) => {})
    const modals = answerModals(false)
    const tile = renderCrossChainTile(onChangeAddress)

    await act(async () => {
      await tile.ref.current?.onChangeAddress(`ethereum://${PAYEE}`)
    })
    expect(modals.titles).toEqual([
      sprintf(lstrings.gateway_agreement_modal_title, 'USDT')
    ])
    expect(onChangeAddress).not.toHaveBeenCalled()

    modals.restore()
    tile.unmount()
  })

  it('takes a gateway code once the warning is accepted', async () => {
    const onChangeAddress = jest.fn(async (result: ChangeAddressResult) => {})
    const modals = answerModals(true)
    const tile = renderCrossChainTile(onChangeAddress)

    await act(async () => {
      await tile.ref.current?.onChangeAddress(`ethereum://${PAYEE}`)
    })
    expect(onChangeAddress).toHaveBeenCalledWith(
      expect.objectContaining({ parsedUri: { publicAddress: PAYEE } })
    )

    modals.restore()
    tile.unmount()
  })
})
