import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import { HelpModal } from '../../components/modals/HelpModal'
import { showSupportChatModal } from '../../components/modals/SupportChatModal'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'
import { openBrowserUri } from '../../util/WebUtils'

jest.mock('../../components/modals/SupportChatModal', () => ({
  showSupportChatModal: jest.fn(async () => {})
}))
jest.mock('../../util/WebUtils', () => ({
  openBrowserUri: jest.fn(async () => {})
}))

const SITE_URI = 'https://support.example.com/chat'

describe('HelpModal Live Chat', () => {
  const bridge = { ...fakeAirshipBridge, resolve: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    config.supportChatSite = SITE_URI
    config.intercomAppId = undefined
  })

  async function pressLiveChat(): Promise<void> {
    const rendered = render(
      <FakeProviders>
        <HelpModal bridge={bridge} navigation={fakeNavigation} />
      </FakeProviders>
    )
    await act(async () => {
      fireEvent.press(rendered.getByText(lstrings.help_live_chat))
    })
    rendered.unmount()
  }

  it('opens the in-app chat when Intercom is configured', async () => {
    config.intercomAppId = 'abc123'
    await pressLiveChat()

    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(showSupportChatModal).toHaveBeenCalledWith('abc123', SITE_URI)
    expect(openBrowserUri).not.toHaveBeenCalled()
  })

  it('opens the support site otherwise', async () => {
    await pressLiveChat()

    expect(openBrowserUri).toHaveBeenCalledWith(SITE_URI)
    expect(showSupportChatModal).not.toHaveBeenCalled()
  })
})
