import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import { makeMemoryDisklet } from 'disklet'
import * as React from 'react'

import {
  LOCAL_SETTINGS_FILENAME,
  resetLocalAccountSettingsCache
} from '../../actions/LocalSettingsActions'
import { LargeUtxoWalletCard } from '../../components/cards/LargeUtxoWalletCard'
import { EdgeTouchableOpacity } from '../../components/common/EdgeTouchableOpacity'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { logActivity } from '../../util/logger'

jest.mock('../../util/logger', () => ({ logActivity: jest.fn() }))

const makeFakeWallet = (id: string): any => ({
  id,
  currencyInfo: btcCurrencyInfo
})

const renderCard = (
  wallet: any,
  initialState: FakeState = {}
): ReturnType<typeof render> =>
  render(
    <FakeProviders initialState={initialState}>
      <LargeUtxoWalletCard wallet={wallet} />
    </FakeProviders>
  )

describe('LargeUtxoWalletCard', () => {
  afterEach(() => {
    resetLocalAccountSettingsCache()
  })

  it('should render', () => {
    const rendered = renderCard(makeFakeWallet('fake-wallet-id'))

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('stays closed for every wallet once closed', async () => {
    const disklet = makeMemoryDisklet()
    const initialState: FakeState = {
      core: { account: { localDisklet: disklet } }
    }
    const rendered = renderCard(makeFakeWallet('wallet-1'), initialState)

    // The close button is the card's last touchable, after Learn More:
    const touchables = rendered.UNSAFE_getAllByType(EdgeTouchableOpacity)
    fireEvent.press(touchables[touchables.length - 1])
    await act(async () => {})
    expect(rendered.toJSON()).toBeNull()
    expect(logActivity).toHaveBeenCalledWith(
      'Large Tx History card closed: bitcoin wallet-1'
    )
    rendered.unmount()

    // The close is saved to the account's local settings:
    const text = await disklet.getText(LOCAL_SETTINGS_FILENAME)
    expect(JSON.parse(text).largeTxHistoryCardDismissed).toBe(true)

    // Reopening the same wallet, or opening another, keeps the card hidden:
    const reopened = renderCard(makeFakeWallet('wallet-1'), initialState)
    expect(reopened.toJSON()).toBeNull()
    reopened.unmount()
    const other = renderCard(makeFakeWallet('wallet-2'), initialState)
    expect(other.toJSON()).toBeNull()
    other.unmount()
  })
})
