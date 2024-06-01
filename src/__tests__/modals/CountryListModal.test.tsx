import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CountryListModal } from '../../components/modals/CountryListModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('CountryListModal', () => {
  const fakeAccount: any = { disklet: { getText: async () => '' } }
  const fakeState: FakeState = {
    core: {
      account: fakeAccount
    }
  }

  it('should render with a country list', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <CountryListModal bridge={fakeAirshipBridge} countryCode="" />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
