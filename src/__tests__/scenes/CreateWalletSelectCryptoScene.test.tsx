import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletSelectCryptoComponent } from '../../components/scenes/CreateWalletSelectCryptoScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeUser } from '../../util/fake-user'

describe('CreateWalletSelectCrypto', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
      navigation: fakeNavigation,
      account: () => fakeUser,
      theme: getTheme()
    }
    const actual = renderer.render(<CreateWalletSelectCryptoComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
