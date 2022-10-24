import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { EdgeLoginSceneComponent } from '../../components/scenes/EdgeLoginScene'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('EdgeLoginSceneComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <EdgeLoginSceneComponent
        navigation={fakeNavigation}
        error="Not normal expected behavior"
        isProcessing
        lobby={{
          loginRequest: {
            appId: '',
            approve: async () => undefined,
            displayName: 'myAccount',
            displayImageUrl: ''
          }
        }}
        accept={() => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
