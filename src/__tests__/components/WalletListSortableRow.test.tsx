import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { WalletListSortableRow } from '../../components/themed/WalletListSortableRow'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('WalletListSortableRow', () => {
  it('should render with loading wallet', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <WalletListSortableRow wallet={undefined} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
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

    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <WalletListSortableRow wallet={fakeWallet} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
