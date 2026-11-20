import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import { HelpModal } from '../../components/modals/HelpModal'
import { showIntercomChatModal } from '../../components/modals/IntercomChatModal'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'
import { openBrowserUri } from '../../util/WebUtils'

jest.mock('../../components/modals/IntercomChatModal', () => ({
  showIntercomChatModal: jest.fn(async () => {})
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
    config.intercomApiBase = undefined
    config.intercomAppId = undefined
  })

  async function pressLiveChat(taps: number = 1): Promise<void> {
    const rendered = render(
      <FakeProviders>
        <HelpModal bridge={bridge} navigation={fakeNavigation} />
      </FakeProviders>
    )
    for (let i = 0; i < taps; ++i) {
      await act(async () => {
        fireEvent.press(rendered.getByText(lstrings.help_live_chat))
      })
    }
    rendered.unmount()
  }

  it('opens the in-app chat when Intercom is configured', async () => {
    config.intercomAppId = 'abc123'
    await pressLiveChat()

    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(showIntercomChatModal).toHaveBeenCalledWith({
      appId: 'abc123',
      apiBase: undefined,
      siteUri: SITE_URI
    })
    expect(openBrowserUri).not.toHaveBeenCalled()
  })

  it('passes the workspace region to the chat', async () => {
    config.intercomAppId = 'abc123'
    config.intercomApiBase = 'https://api-iam.eu.intercom.io'
    await pressLiveChat()

    expect(showIntercomChatModal).toHaveBeenCalledWith({
      appId: 'abc123',
      apiBase: 'https://api-iam.eu.intercom.io',
      siteUri: SITE_URI
    })
  })

  it('opens one chat when Live Chat is tapped twice', async () => {
    config.intercomAppId = 'abc123'
    await pressLiveChat(2)

    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(showIntercomChatModal).toHaveBeenCalledTimes(1)
  })

  it('opens the support site otherwise', async () => {
    await pressLiveChat()

    expect(openBrowserUri).toHaveBeenCalledWith(SITE_URI)
    expect(showIntercomChatModal).not.toHaveBeenCalled()
  })
})
