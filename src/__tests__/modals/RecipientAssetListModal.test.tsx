import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'

import {
  RecipientAssetListModal,
  type RecipientAssetRow
} from '../../components/modals/RecipientAssetListModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

const TITLE = 'Recipient receives'

const makeRow = (
  value: string,
  name: string,
  network: string,
  currencyCode: string
): RecipientAssetRow => ({ value, icon: null, name, network, currencyCode })

// The hard cases: one coin on two networks, one token on two networks, and a
// chain whose coin shares its name.
const rows: RecipientAssetRow[] = [
  makeRow('bitcoin', 'Bitcoin', 'Bitcoin Network', 'BTC'),
  makeRow('ethereum', 'Ethereum', 'Ethereum Network', 'ETH'),
  makeRow('optimism', 'Ethereum', 'Optimism Network', 'ETH'),
  makeRow('ethereum:usdt', 'Tether', 'Ethereum Network', 'USDT'),
  makeRow('tron:usdt', 'Tether', 'Tron Network', 'USDT')
]

type Resolve = AirshipBridge<string | undefined>['resolve']

const renderModal = (
  resolve: Resolve = () => undefined
): ReturnType<typeof render> =>
  render(
    <FakeProviders>
      <RecipientAssetListModal
        bridge={{ ...fakeAirshipBridge, resolve }}
        title={TITLE}
        searchPlaceholder="Search Assets"
        rows={rows}
      />
    </FakeProviders>
  )

const visibleRows = (rendered: ReturnType<typeof render>): string[] =>
  rows
    .map(row => row.value)
    .filter(value => rendered.queryByTestId(`radioListItem_${value}`) != null)

describe('RecipientAssetListModal', () => {
  it('names the asset, its network and its code on every row', () => {
    const rendered = renderModal()

    expect(visibleRows(rendered)).toEqual(rows.map(row => row.value))
    expect(rendered.getAllByText('Ethereum')).toHaveLength(2)
    expect(rendered.getAllByText('Optimism Network')).toHaveLength(1)
    expect(rendered.getAllByText('Tron Network')).toHaveLength(1)
    expect(rendered.getAllByText('Bitcoin Network')).toHaveLength(1)
    expect(rendered.getAllByText('USDT')).toHaveLength(2)
    rendered.unmount()
  })

  it('marks no row as the current pick', () => {
    const rendered = renderModal()

    expect(rendered.queryAllByRole('radio')).toHaveLength(0)
    rendered.unmount()
  })

  it('resolves with the tapped row, not its label', () => {
    const resolve = jest.fn<Resolve>()
    const rendered = renderModal(resolve)

    fireEvent.press(rendered.getByTestId('radioListItem_tron:usdt'))

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve).toHaveBeenCalledWith('tron:usdt')
    rendered.unmount()
  })

  it('searches the name, the network line and the code', () => {
    const rendered = renderModal()
    const search = rendered.getByTestId(TITLE)

    fireEvent.changeText(search, 'tether')
    expect(visibleRows(rendered)).toEqual(['ethereum:usdt', 'tron:usdt'])

    fireEvent.changeText(search, 'optimism')
    expect(visibleRows(rendered)).toEqual(['optimism'])

    fireEvent.changeText(search, 'Tron Network')
    expect(visibleRows(rendered)).toEqual(['tron:usdt'])

    fireEvent.changeText(search, 'eth')
    expect(visibleRows(rendered)).toEqual([
      'ethereum',
      'optimism',
      'ethereum:usdt',
      'tron:usdt'
    ])

    fireEvent.changeText(search, 'btc')
    expect(visibleRows(rendered)).toEqual(['bitcoin'])
    rendered.unmount()
  })

  it('does not match a search split across name and code', () => {
    const rendered = renderModal()

    fireEvent.changeText(rendered.getByTestId(TITLE), 'Ethereum USDT')
    expect(visibleRows(rendered)).toEqual([])
    rendered.unmount()
  })
})
