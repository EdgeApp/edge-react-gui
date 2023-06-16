import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ChangePasswordComponent } from '../../components/scenes/ChangePasswordScene'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('ChangePasswordComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {}
    const fakeContext: any = { apiKey: '', appId: '' }

    const actual = renderer.render(<ChangePasswordComponent navigation={fakeNavigation} account={fakeAccount} context={fakeContext} />)

    expect(actual).toMatchSnapshot()
  })
})
