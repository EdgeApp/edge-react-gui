import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { FioAddressRegistered } from '../../components/scenes/Fio/FioAddressRegisteredScene'
import { getTheme } from '../../components/services/ThemeContext'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioAddressRegistered', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <FioAddressRegistered
          {...fakeEdgeAppSceneProps('fioAddressRegisterSuccess', {
            fioName: 'myFio@edge'
          })}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
