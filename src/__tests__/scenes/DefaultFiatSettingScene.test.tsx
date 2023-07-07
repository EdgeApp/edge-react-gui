import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { DefaultFiatSettingComponent } from '../../components/scenes/DefaultFiatSettingScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('DefaultFiatSettingComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <DefaultFiatSettingComponent
        {...fakeSceneProps('defaultFiatSetting', {})}
        supportedFiats={[
          {
            label: 'Dollars',
            value: 'USD'
          }
        ]}
        onSelectFiat={async selectedDefaultFiat => {}}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
