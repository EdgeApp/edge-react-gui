import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'

import { WalletListSortableRow } from '../../components/themed/WalletListSortableRow'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('WalletListSortableRow', () => {
  it('should render with loading wallet', () => {
    const rendered = render(
      <FakeProviders>
        <WalletListSortableRow wallet={undefined} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render with fake wallet', () => {
    const fakeCurrencyInfo: Partial<EdgeCurrencyInfo> = {
      pluginId: 'fake',
      currencyCode: 'FAKE',
      denominations: [{ name: 'FAKE', multiplier: '1' }]
    }
    const fakeState: FakeState = {
      core: {
        account: {
          currencyConfig: {
            fake: {
              allTokens: {},
              currencyInfo: fakeCurrencyInfo
            }
          },
          watch: () => () => {}
        }
      }
    }
    const fakeWallet: any = {
      currencyConfig: {
        allTokens: {},
        currencyInfo: fakeCurrencyInfo
      },
      currencyInfo: fakeCurrencyInfo,
      name: 'Test wallet',
      balanceMap: new Map()
    }

    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <WalletListSortableRow wallet={fakeWallet} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
