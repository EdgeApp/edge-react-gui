import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ChangePasswordComponent } from '../../components/scenes/ChangePasswordScene'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('ChangePasswordComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {}
    const fakeContext: any = { apiKey: '', appId: '' }

    const actual = renderer.render(<ChangePasswordComponent {...fakeSceneProps('changePassword', {})} account={fakeAccount} context={fakeContext} />)

    expect(actual).toMatchSnapshot()
  })
})
