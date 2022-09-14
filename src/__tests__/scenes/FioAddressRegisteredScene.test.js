// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioAddressRegistered } from '../../components/scenes/FioAddressRegisteredScene'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('FioAddressRegistered', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
      route: {
        params: {
          fioName: 'myFio@edge'
        }
      },
      theme: getTheme()
    }
    const actual = renderer.render(<FioAddressRegistered {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
