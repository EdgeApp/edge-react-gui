import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletChoiceScene } from '../../components/scenes/CreateWalletChoiceScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CreateWalletChoiceScene', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
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
    const actual = renderer.render(<CreateWalletChoiceScene {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
