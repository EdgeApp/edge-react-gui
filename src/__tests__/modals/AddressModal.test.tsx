import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import { makeMemoryDisklet } from 'disklet'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { AddressModalComponent } from '../../components/modals/AddressModal'
import { getTheme } from '../../components/services/ThemeContext'
import { globalKeys } from '../../keys'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AddressModalComponent', () => {
  it('should render with loaded props', () => {
    const fakeDispatch: any = () => {}
    const fakeAccount: any = {
      disklet: makeMemoryDisklet()
    }
    const fakeWallet: any = {
      currencyInfo: {
        currencyCode: 'BTC'
      }
    }

    const rendered = render(
      <FakeProviders>
        <AddressModalComponent
          bridge={fakeAirshipBridge}
          walletId="string"
          currencyCode="string"
          title="string"
          isFioOnly
          useUserFioAddressesOnly
          checkAddressConnected
          account={fakeAccount}
          userFioAddresses={[
            {
              name: 'string',
              bundledTxs: 11,
              walletId: 'string'
            }
          ]}
          userFioAddressesLoading
          coreWallet={fakeWallet}
          dispatch={fakeDispatch}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

const nickAddress = '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'
const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const makeEnsWallet = (pluginId: string): EdgeCurrencyWallet =>
  ({
    currencyInfo: { currencyCode: 'ETH', pluginId },
    otherMethods: {},
    parseUri: async () => {
      throw new Error('Not an address')
    }
  } as unknown as EdgeCurrencyWallet)

const makeEnsAccount = (
  resolveEnsName: (name: string, chainId?: number) => Promise<string | null>
): EdgeAccount =>
  ({
    currencyConfig: { ethereum: { otherMethods: { resolveEnsName } } },
    disklet: makeMemoryDisklet()
  } as unknown as EdgeAccount)

const renderModal = (
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): {
  modal: AddressModalComponent
  unmount: () => void
} => {
  const ref = React.createRef<AddressModalComponent>()
  const fakeDispatch: any = () => {}
  const rendered = render(
    <FakeProviders>
      <AddressModalComponent
        ref={ref}
        bridge={fakeAirshipBridge}
        walletId="wallet"
        currencyCode="ETH"
        account={account}
        userFioAddresses={[]}
        userFioAddressesLoading={false}
        coreWallet={wallet}
        dispatch={fakeDispatch}
        theme={getTheme()}
      />
    </FakeProviders>
  )
  if (ref.current == null) throw new Error('No modal')
  return { modal: ref.current, unmount: rendered.unmount }
}

describe('AddressModalComponent ENS names', () => {
  beforeEach(() => {
    // Leave Unstoppable Domains out so ENS is the only service that runs:
    globalKeys.UNSTOPPABLE_DOMAINS_API_KEY = null
  })

  it('forgets the resolved address when the input changes', async () => {
    const resolveEnsName = jest.fn(async (_name: string) => nickAddress)
    const { modal, unmount } = renderModal(
      makeEnsAccount(resolveEnsName),
      makeEnsWallet('ethereum')
    )

    await act(async () => {
      await modal.onChangeTextDelayed('nick.eth')
    })
    expect(modal.state.cryptoAddress).toBe(nickAddress)

    await act(async () => {
      await modal.onChangeTextDelayed('0x1234')
    })
    expect(modal.state.cryptoAddress).toBe(undefined)

    unmount()
  })

  it('ignores a name that resolves after the input changed', async () => {
    let finishNick: (address: string) => void = () => {}
    const resolveEnsName = jest.fn(
      async (name: string): Promise<string | null> =>
        name === 'nick.eth'
          ? await new Promise<string>(resolve => {
              finishNick = resolve
            })
          : vitalikAddress
    )
    const { modal, unmount } = renderModal(
      makeEnsAccount(resolveEnsName),
      makeEnsWallet('ethereum')
    )

    let nickDone: Promise<void> = Promise.resolve()
    act(() => {
      nickDone = modal.onChangeTextDelayed('nick.eth')
    })
    await act(async () => {
      await modal.onChangeTextDelayed('vitalik.eth')
    })
    await act(async () => {
      finishNick(nickAddress)
      await nickDone
    })

    expect(modal.state.cryptoAddress).toBe(vitalikAddress)
    expect(modal.state.validLabel).toBe(vitalikAddress)
    expect(modal.state.showSpinner).toBe(false)

    unmount()
  })
})

describe('AddressModalComponent ENS chains', () => {
  beforeEach(() => {
    globalKeys.UNSTOPPABLE_DOMAINS_API_KEY = null
  })

  it("resolves dotted names for the wallet's EVM chain", async () => {
    const resolveEnsName = jest.fn(
      async (_name: string, _chainId?: number) => nickAddress
    )
    const { modal, unmount } = renderModal(
      makeEnsAccount(resolveEnsName),
      makeEnsWallet('polygon')
    )

    await act(async () => {
      await modal.onChangeTextDelayed('nick.box')
    })
    expect(resolveEnsName).toHaveBeenCalledWith('nick.box', 137)
    expect(modal.state.cryptoAddress).toBe(nickAddress)

    unmount()
  })

  it('refuses ENS names on other chains', async () => {
    const resolveEnsName = jest.fn(
      async (_name: string, _chainId?: number) => nickAddress
    )
    const { modal, unmount } = renderModal(
      makeEnsAccount(resolveEnsName),
      makeEnsWallet('bitcoin')
    )

    await act(async () => {
      await modal.onChangeTextDelayed('nick.eth')
    })
    expect(resolveEnsName).not.toHaveBeenCalled()
    expect(modal.state.cryptoAddress).toBe(undefined)
    expect(modal.state.errorLabel).toBe('Domain nick.eth is not supported')

    unmount()
  })
})
