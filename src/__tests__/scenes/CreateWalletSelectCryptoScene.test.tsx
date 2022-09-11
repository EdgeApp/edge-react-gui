/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletSelectCryptoComponent } from '../../components/scenes/CreateWalletSelectCryptoScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeUser } from '../../util/fake-user'

describe('CreateWalletSelectCrypto', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: fakeNavigation,
      account: () => fakeUser,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<CreateWalletSelectCryptoComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
