import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { WalletListModal } from '../../components/modals/WalletListModal'
import { EdgeTokenId } from '../../types/types'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'
import { upgradeCurrencyCodes } from '../../util/tokenIdTools'

describe('WalletListModal', () => {
  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <WalletListModal bridge={fakeAirshipBridge} navigation={fakeNavigation} headerTitle="Wallet List" />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })

  it("Should upgrade currency codes to token ID's", () => {
    const data: { [code: string]: EdgeTokenId[] } = {
      ETH: [{ pluginId: 'ethereum' }],
      BNB: [{ pluginId: 'binance' }, { pluginId: 'ethereum', tokenId: '1234abcd' }]
    }
    function lookup(currencyCode: string): EdgeTokenId[] {
      return data[currencyCode.toUpperCase()] ?? []
    }

    // Check ambiguous currency codes:
    expect(upgradeCurrencyCodes(lookup, ['ETH', 'BNB'])).toEqual([
      { pluginId: 'ethereum' },
      { pluginId: 'binance' },
      { pluginId: 'ethereum', tokenId: '1234abcd' }
    ])

    // Check scoped currency codes:
    expect(upgradeCurrencyCodes(lookup, ['ETH', 'ETH-BNB'])).toEqual([{ pluginId: 'ethereum' }, { pluginId: 'ethereum', tokenId: '1234abcd' }])

    // Check missing currency codes:
    expect(upgradeCurrencyCodes(lookup, ['ETH', 'LOL'])).toEqual([{ pluginId: 'ethereum' }])
  })
})
