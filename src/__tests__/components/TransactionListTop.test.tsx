import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { TransactionListTopComponent } from '../../components/themed/TransactionListTop'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('TransactionListTop', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <TransactionListTopComponent
        cryptoAmount="string"
        currencyCode="string"
        pluginId="string"
        denominationName="string"
        fiatCurrencyCode="string"
        fiatBalance="string"
        fiatSymbol="string"
        walletName="string"
        isAccountBalanceVisible
        stakingBalances={{
          FIO: {
            crypto: 'string',
            fiat: 'string'
          }
        }}
        onSelectWallet={() => undefined}
        onChangeSortingState={() => undefined}
        onSearchTransaction={() => undefined}
        toggleBalanceVisibility={() => undefined}
        walletId="string"
        isEmpty={false}
        searching={false}
        navigation={fakeNavigation}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
