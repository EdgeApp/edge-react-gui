/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletChoiceScene } from '../../components/scenes/CreateWalletChoiceScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CreateWalletChoiceScene', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: fakeNavigation,
      route: {
        name: 'createWalletChoice',
        params: {
          selectedWalletType: {
            currencyName: 'bitcoin',
            walletType: 'wallet:bitcoin',
            symbolImage: 'BTC',
            currencyCode: 'BTC'
          }
        }
      },
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<CreateWalletChoiceScene {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
