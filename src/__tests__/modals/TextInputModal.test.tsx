import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { TextInputModal } from '../../components/modals/TextInputModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('TextInputModal', () => {
  const fakeAccount: any = { disklet: { getText: async () => '' } }
  const fakeState: FakeState = {
    core: {
      account: fakeAccount
    }
  }

  it('should render with a blank input field', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TextInputModal bridge={fakeAirshipBridge} title="title" message="message" />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })

  it('should render with a populated input field', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TextInputModal bridge={fakeAirshipBridge} title="title" message="message" initialValue="initialValue" />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
