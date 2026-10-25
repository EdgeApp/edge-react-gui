import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Linking } from 'react-native'

import { ExplorerLink } from '../../components/themed/ExplorerCard'
import { lstrings } from '../../locales/strings'
import { FakeProviders } from '../../util/fake/FakeProviders'

const makeWallet = (addressExplorer: string, pluginId = 'zcash'): any => ({
  id: 'my wallet',
  currencyInfo: {
    pluginId,
    displayName: 'Test Coin',
    addressExplorer
  },
  getAddresses: async () => [
    { addressType: 'transparentAddress', publicAddress: 't1transparent' },
    { addressType: 'publicAddress', publicAddress: 'u1public' }
  ]
})

describe('ExplorerLink', () => {
  it('should render a button when the chain has an explorer', () => {
    const rendered = render(
      <FakeProviders>
        <ExplorerLink wallet={makeWallet('https://explorer.test/%s')} />
      </FakeProviders>
    )

    expect(
      rendered.getByText(
        lstrings.transaction_details_advance_details_show_explorer
      )
    ).toBeTruthy()
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render nothing when the chain has no explorer', () => {
    const rendered = render(
      <FakeProviders>
        <ExplorerLink wallet={makeWallet('')} />
      </FakeProviders>
    )

    expect(
      rendered.queryByText(
        lstrings.transaction_details_advance_details_show_explorer
      )
    ).toBeNull()
    rendered.unmount()
  })

  it('should render nothing on a UTXO chain', () => {
    const rendered = render(
      <FakeProviders>
        <ExplorerLink
          wallet={makeWallet('https://explorer.test/%s', 'bitcoin')}
        />
      </FakeProviders>
    )

    expect(
      rendered.queryByText(
        lstrings.transaction_details_advance_details_show_explorer
      )
    ).toBeNull()
    rendered.unmount()
  })

  it('should open the primary address on the explorer', async () => {
    const openURL = jest
      .spyOn(Linking, 'openURL')
      .mockImplementation(async () => true)
    const rendered = render(
      <FakeProviders>
        <ExplorerLink wallet={makeWallet('https://explorer.test/%s')} />
      </FakeProviders>
    )

    fireEvent.press(
      rendered.getByText(
        lstrings.transaction_details_advance_details_show_explorer
      )
    )
    await waitFor(() => {
      expect(openURL).toHaveBeenCalledWith('https://explorer.test/u1public')
    })
    openURL.mockRestore()
    rendered.unmount()
  })
})
