import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ChangePinComponent } from '../../components/scenes/ChangePinScene'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('ChangePinComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {}
    const fakeContext: any = { apiKey: '', appId: '' }

    const actual = renderer.render(<ChangePinComponent navigation={fakeNavigation} account={fakeAccount} context={fakeContext} />)

    expect(actual).toMatchSnapshot()
  })
})
