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
  it('resolves an ENS name through the ethereum plugin', async () => {
    const nickAddress = '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'
    const resolveEnsName = jest.fn(async (_name: string) => nickAddress)
    const config: EdgeCurrencyConfig = {
      ...ethConfig,
      otherMethods: { resolveEnsName }
    }
    const wallet = {
      ...makeWallet('source', async () => []),
      currencyConfig: config,
      parseUri: async (uri: string) => ({ publicAddress: uri })
    } as unknown as EdgeCurrencyWallet
    const onChangeAddress = jest.fn(async (_result: ChangeAddressResult) => {})
    const pasteSpy = jest
      .spyOn(Clipboard, 'getString')
      .mockResolvedValue('nick.eth')

    const rootState: FakeState = {
      core: {
        account: {
          currencyConfig: { ethereum: config },
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
      expect(onChangeAddress).toHaveBeenCalled()
    })
    expect(resolveEnsName).toHaveBeenCalledWith('nick.eth')
    const [result] = onChangeAddress.mock.calls[0]
    expect(result.parsedUri?.publicAddress).toBe(nickAddress)
    expect(result.resolvedName).toEqual({ name: 'nick.eth', service: 'ens' })

    pasteSpy.mockRestore()
    rendered.unmount()
  })
})
