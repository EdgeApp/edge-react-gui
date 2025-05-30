import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { DateModalIos } from '../../components/modals/DateModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('DateModalIos', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <DateModalIos
          bridge={fakeAirshipBridge}
          // Chancellor on brink of second bailout for banks:
          initialValue={new Date('2009-01-03T18:15:05.000Z')}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
