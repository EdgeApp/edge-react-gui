import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import { CreateWalletEditNameScene } from '../../components/scenes/CreateWalletEditNameScene'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('CreateWalletEditNameComponent', () => {
  const mockState: FakeState = {
    ui: {
      settings: {
        defaultIsoFiat: 'USD'
      }
    },
    core: {
      account: {
        currencyConfig: {
          bitcoin: makeFakeCurrencyConfig(btcCurrencyInfo),
          ethereum: makeFakeCurrencyConfig(ethCurrencyInfo, {
            '9992ec3cf6a55b00978cddf2b27bc6882d88d1ec': {
              currencyCode: 'POLY',
              denominations: [],
              displayName: '',
              networkLocation: {}
            }
          })
        },
        currencyWallets: {
          'bNBAI/Z4YE1h6qk1p28jhjGJwMiARqvZPfnAt6LyxkA=': {
            name: 'My Ether',
            currencyInfo: {
              pluginId: 'ethereum'
            }
          }
        },
        watch: () => () => {}
      }
    }
  }

  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders initialState={mockState}>
        <CreateWalletEditNameScene
          {...fakeEdgeAppSceneProps('createWalletEditName', {
            createWalletList: [
              {
                type: 'create',
                key: 'create-wallet:bitcoin-bip44-bitcoin',
                currencyCode: 'BTC',
                displayName: 'Bitcoin (no Segwit)',
                pluginId: 'bitcoin',
                tokenId: null,
                walletType: 'wallet:bitcoin-bip44'
              },
              {
                type: 'create',
                key: 'create-wallet:ethereum-ethereum',
                currencyCode: 'ETH',
                displayName: 'Ethereum',
                pluginId: 'ethereum',
                tokenId: null,
                walletType: 'wallet:ethereum'
              },
              {
                type: 'create',
                key: 'create-ethereum-9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
                currencyCode: 'POLY',
                displayName: 'Polymath Network',
                pluginId: 'ethereum',
                tokenId: '9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
                createWalletIds: [
                  'bNBAI/Z4YE1h6qk1p28jhjGJwMiARqvZPfnAt6LyxkA='
                ]
              }
            ]
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  describe('splitting', () => {
    const SOURCE_WALLET_ID = 'btc-wallet-id'

    const renderSplit = (
      pluginId: string
    ): {
      rendered: ReturnType<typeof render>
      split: jest.Mock<() => Promise<[]>>
    } => {
      const split = jest.fn(async (): Promise<[]> => [])
      const splitState: FakeState = {
        ui: { settings: { defaultIsoFiat: 'USD' } },
        core: {
          account: {
            currencyConfig: {
              [pluginId]: makeFakeCurrencyConfig({
                ...btcCurrencyInfo,
                pluginId,
                walletType: `wallet:${pluginId}`
              })
            },
            currencyWallets: {
              [SOURCE_WALLET_ID]: {
                name: 'My Bitcoin',
                currencyInfo: btcCurrencyInfo,
                fiatCurrencyCode: 'iso:USD',
                split
              }
            },
            watch: () => () => {}
          }
        }
      }
      const rendered = render(
        <FakeProviders initialState={splitState}>
          <CreateWalletEditNameScene
            {...fakeEdgeAppSceneProps('createWalletEditName', {
              createWalletList: [
                {
                  type: 'create',
                  key: `create-wallet:${pluginId}`,
                  currencyCode: 'ECX',
                  displayName: 'eCash',
                  pluginId,
                  tokenId: null,
                  walletType: `wallet:${pluginId}`
                }
              ],
              splitSourceWalletId: SOURCE_WALLET_ID
            })}
          />
        </FakeProviders>
      )
      return { rendered, split }
    }

    const pressSplit = async (
      rendered: ReturnType<typeof render>
    ): Promise<void> => {
      await act(async () => {
        fireEvent.press(rendered.getByTestId('splitWalletConfirmButton'))
      })
    }

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('splits into eCash once the user confirms', async () => {
      const showModal = jest.spyOn(Airship, 'show').mockResolvedValue('split')
      const { rendered, split } = renderSplit('ecashbitcoin')

      await pressSplit(rendered)

      const [renderModal] = showModal.mock.calls[0]
      const modal = renderModal(fakeAirshipBridge)
      if (!React.isValidElement<{ title: string }>(modal)) {
        throw new Error('Expected the eCash split modal')
      }
      expect(modal.props.title).toBe(lstrings.ecash_split_confirm_title)
      expect(split).toHaveBeenCalledTimes(1)
      rendered.unmount()
    })

    it('does not split into eCash when the user cancels', async () => {
      jest.spyOn(Airship, 'show').mockResolvedValue(undefined)
      const { rendered, split } = renderSplit('ecashbitcoin')

      await pressSplit(rendered)

      expect(split).not.toHaveBeenCalled()
      rendered.unmount()
    })

    it('splits into other assets without asking', async () => {
      const showModal = jest.spyOn(Airship, 'show')
      const { rendered, split } = renderSplit('bitcoincash')

      await pressSplit(rendered)

      expect(showModal).not.toHaveBeenCalled()
      expect(split).toHaveBeenCalledTimes(1)
      rendered.unmount()
    })
  })
})
