import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import type { EdgeAddress, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { Airship } from '../../components/services/AirshipInstance'
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
      (asset: EdgeAsset, address: string) => Promise<boolean>
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
        tokenAddress.publicAddress
      )
    })
    expect(getAddresses).toHaveBeenCalledWith({ tokenId: USDC_TOKEN_ID })

    showSpy.mockRestore()
    rendered.unmount()
  })
})
