import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { HelpModal } from '../../components/modals/HelpModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('HelpModal', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <HelpModal bridge={fakeAirshipBridge} navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
