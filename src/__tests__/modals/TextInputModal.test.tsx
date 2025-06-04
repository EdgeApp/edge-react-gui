import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

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
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <TextInputModal bridge={fakeAirshipBridge} title="title" message="message" />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render with a populated input field', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <TextInputModal bridge={fakeAirshipBridge} title="title" message="message" initialValue="initialValue" />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
