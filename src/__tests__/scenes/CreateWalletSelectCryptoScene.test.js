/* eslint-disable flowtype/require-valid-file-annotation */

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletSelectCryptoComponent } from '../../components/scenes/CreateWalletSelectCryptoScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'
import { fakeUser } from '../../util/fake-user.js'

describe('CreateWalletSelectCrypto', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      navigation: fakeNavigation,
      account: () => fakeUser,
      theme: getTheme()
    }
    const actual = renderer.render(<CreateWalletSelectCryptoComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
