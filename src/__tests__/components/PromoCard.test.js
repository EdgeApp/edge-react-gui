/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { PromoCard } from '../../components/cards/PromoCard.js'

describe('PromoCard', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      message: 'MessageTweak',
      onClose: (messageId, source) => undefined,
      onPress: uri => undefined
    }
    const actual = renderer.render(<PromoCard {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
