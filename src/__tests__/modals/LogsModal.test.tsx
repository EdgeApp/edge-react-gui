import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { MultiLogOutput } from '../../actions/LogActions'
import { LogsModal } from '../../components/modals/LogsModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('LogsModal', () => {
  const fakeAccount: any = { disklet: { getText: async () => '' } }
  const fakeState: FakeState = {
    core: {
      account: fakeAccount
    }
  }

  const fakeLogs: MultiLogOutput = {
    activity: {
      isoDate: 'isoDate',
      uniqueId: 'uniqueId',
      userMessage: 'userMessage',
      deviceInfo: 'deviceInfo',
      appVersion: 'appVersion',
      OS: 'OS',
      accounts: [
        {
          username: 'userName',
          userId: 'userId'
        }
      ],
      data: 'data'
    },
    info: {
      isoDate: 'isoDate',
      uniqueId: 'uniqueId',
      userMessage: 'userMessage',
      deviceInfo: 'deviceInfo',
      appVersion: 'appVersion',
      OS: 'OS',
      accounts: [
        {
          username: 'userName',
          userId: 'userId'
        }
      ],
      data: 'data'
    }
  }

  it('should render with a logs modal', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <LogsModal bridge={fakeAirshipBridge} logs={fakeLogs} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
