// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { PromoCardComponent } from '../../components/cards/PromoCard.js'
import { getTheme } from '../../components/services/ThemeContext.js'

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

      hideMessageTweak: (messageId, source) => undefined,
      linkReferralWithCurrencies: uri => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<PromoCardComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
