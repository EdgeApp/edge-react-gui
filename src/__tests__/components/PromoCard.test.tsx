import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { PromoCardComponent } from '../../components/cards/PromoCard'
import { getTheme } from '../../components/services/ThemeContext'

describe('PromoCard', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
      accountMessages: ['MessageTweak'],
      accountReferral: {
        installerId: 'string',
        currencyCodes: ['BTC'],
        promotions: [],
        ignoreAccountSwap: true,
        hiddenAccountMessages: ['messageId']
      },

      // @ts-expect-error
      hideMessageTweak: (messageId, source) => undefined,
      // @ts-expect-error
      linkReferralWithCurrencies: uri => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<PromoCardComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
