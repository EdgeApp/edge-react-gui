import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { PromoCardComponent } from '../../components/cards/PromoCard'
import { getTheme } from '../../components/services/ThemeContext'

describe('PromoCard', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeMessages: any[] = ['MessageTweak']
    const fakeReferral: any = {
      installerId: 'string',
      currencyCodes: ['BTC'],
      promotions: [],
      ignoreAccountSwap: true,
      hiddenAccountMessages: ['messageId']
    }

    const actual = renderer.render(
      <PromoCardComponent
        accountMessages={fakeMessages}
        accountReferral={fakeReferral}
        hideMessageTweak={(messageId, source) => undefined}
        linkReferralWithCurrencies={uri => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
