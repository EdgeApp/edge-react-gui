/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { PromoCardComponent } from '../../components/cards/PromoCard.js'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('PromoCard', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
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
