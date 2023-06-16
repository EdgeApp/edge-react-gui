import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioAddressRegistered } from '../../components/scenes/Fio/FioAddressRegisteredScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('FioAddressRegistered', () => {
  const nonce = fakeNonce(0)
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <FioAddressRegistered
        navigation={fakeNavigation}
        route={{
          key: `fioAddressRegisterSuccess-${nonce()}`,
          name: 'fioAddressRegisterSuccess',
          params: {
            fioName: 'myFio@edge'
          }
        }}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
