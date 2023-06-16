import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioAddressRegistered } from '../../components/scenes/Fio/FioAddressRegisteredScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioAddressRegistered', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <FioAddressRegistered
        {...fakeSceneProps('fioAddressRegisterSuccess', {
          fioName: 'MyFio@edge'
        })}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
