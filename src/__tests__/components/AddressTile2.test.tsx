import { describe, expect, it, jest } from '@jest/globals'
import Clipboard from '@react-native-clipboard/clipboard'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import type {
  EdgeAddress,
  EdgeCurrencyConfig,
  EdgeCurrencyWallet
} from 'edge-core-js'
import * as React from 'react'

import { Airship } from '../../components/services/AirshipInstance'
import type { ChangeAddressResult } from '../../components/tiles/AddressTile2'
import { AddressTile2 } from '../../components/tiles/AddressTile2'
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

describe('AddressTile2 ENS names', () => {
  const nickAddress = '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'

  /**
   * Pastes a name into a wallet's address tile.
   * The ethereum plugin resolves every ENS name,
   * whichever wallet the tile belongs to.
   */
  const pasteName = async (
    pluginId: string,
    name: string
  ): Promise<{
    onChangeAddress: jest.Mock<(result: ChangeAddressResult) => Promise<void>>
    resolveEnsName: jest.Mock<
      (name: string, chainId?: number) => Promise<string | null>
    >
  }> => {
    const resolveEnsName = jest.fn(
      async (_name: string, _chainId?: number): Promise<string | null> =>
        nickAddress
    )
    const ethereum: EdgeCurrencyConfig = {
      ...ethConfig,
      otherMethods: { resolveEnsName }
    }
    const wallet = {
      ...makeWallet('source', async () => []),
      currencyInfo: { ...ethConfig.currencyInfo, pluginId },
      parseUri: async (uri: string) => {
        if (!uri.startsWith('0x')) throw new Error('Invalid address')
        return { publicAddress: uri }
      }
    } as unknown as EdgeCurrencyWallet
    const onChangeAddress = jest.fn(async (_result: ChangeAddressResult) => {})
    const pasteSpy = jest.spyOn(Clipboard, 'getString').mockResolvedValue(name)
    const toastSpy = jest.spyOn(Airship, 'show').mockResolvedValue(undefined)

    const rootState: FakeState = {
      core: {
        account: {
          currencyConfig: { ethereum },
          currencyWallets: { source: wallet },
          watch: () => () => {}
        }
      }
    }
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <AddressTile2
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

    fireEvent.press(rendered.getByTestId('addressTilePaste'))
    await waitFor(() => {
      expect(
        onChangeAddress.mock.calls.length + toastSpy.mock.calls.length
      ).toBeGreaterThan(0)
    })

    pasteSpy.mockRestore()
    toastSpy.mockRestore()
    rendered.unmount()
    return { onChangeAddress, resolveEnsName }
  }

  it('resolves an ENS name through the ethereum plugin', async () => {
    const { onChangeAddress, resolveEnsName } = await pasteName(
      'ethereum',
      'nick.eth'
    )
    expect(resolveEnsName).toHaveBeenCalledWith('nick.eth', 1)
    const [result] = onChangeAddress.mock.calls[0]
    expect(result.parsedUri?.publicAddress).toBe(nickAddress)
    expect(result.resolvedName).toEqual({ name: 'nick.eth', service: 'ens' })
  })

  it('resolves DNS names through ENS', async () => {
    const { onChangeAddress, resolveEnsName } = await pasteName(
      'ethereum',
      'nick.box'
    )
    expect(resolveEnsName).toHaveBeenCalledWith('nick.box', 1)
    const [result] = onChangeAddress.mock.calls[0]
    expect(result.resolvedName).toEqual({ name: 'nick.box', service: 'ens' })
  })

  it("asks ENS for the wallet's own EVM chain", async () => {
    const { onChangeAddress, resolveEnsName } = await pasteName(
      'polygon',
      'nick.eth'
    )
    expect(resolveEnsName).toHaveBeenCalledWith('nick.eth', 137)
    const [result] = onChangeAddress.mock.calls[0]
    expect(result.parsedUri?.publicAddress).toBe(nickAddress)
  })

  it('does not resolve ENS names on other chains', async () => {
    const { onChangeAddress, resolveEnsName } = await pasteName(
      'bitcoin',
      'nick.eth'
    )
    expect(resolveEnsName).not.toHaveBeenCalled()
    expect(onChangeAddress).not.toHaveBeenCalled()
  })
})
