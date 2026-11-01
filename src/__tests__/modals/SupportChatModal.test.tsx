import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import * as React from 'react'
import { Linking } from 'react-native'
import { WebView } from 'react-native-webview'

import {
  getSupportChatHtml,
  SupportChatModal
} from '../../components/modals/SupportChatModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { openBrowserUri } from '../../util/WebUtils'

jest.mock('../../util/WebUtils', () => ({
  openBrowserUri: jest.fn(async () => {})
}))

const SITE_URI = 'https://support.example.com/chat'

describe('getSupportChatHtml', () => {
  it('passes the app details to Intercom as attributes', () => {
    const html = getSupportChatHtml('abc123', { edge_app_version: '4.53.0' })

    expect(html).toContain('"app_id":"abc123"')
    expect(html).toContain('"edge_app_version":"4.53.0"')
    expect(html).toContain('https://widget.intercom.io/widget/abc123')
  })

  it('opens the Messenger on the composer', () => {
    const html = getSupportChatHtml('abc123', {})

    expect(html).toContain("Intercom('showNewMessage')")
  })

  it('keeps attribute values inside the script tag', () => {
    const html = getSupportChatHtml('abc123', {
      edge_app_version: '</script><script>alert(1)</script>'
    })

    expect(html).not.toContain('</script><script>alert(1)')
  })
})

describe('SupportChatModal', () => {
  const bridge = { ...fakeAirshipBridge, resolve: jest.fn() }
  const openUrl = jest.spyOn(Linking, 'openURL')

  beforeEach(() => {
    jest.clearAllMocks()
    openUrl.mockResolvedValue(undefined)
  })

  function getWebViewProps(): React.ComponentProps<typeof WebView> {
    const rendered = render(
      <FakeProviders>
        <SupportChatModal bridge={bridge} appId="abc123" siteUri={SITE_URI} />
      </FakeProviders>
    )
    return rendered.UNSAFE_getByType(WebView).props
  }

  function shouldStart(url: string, isTopFrame: boolean): boolean | undefined {
    const { onShouldStartLoadWithRequest } = getWebViewProps()
    const event = { url, isTopFrame } as unknown as Parameters<
      NonNullable<typeof onShouldStartLoadWithRequest>
    >[0]
    return onShouldStartLoadWithRequest?.(event)
  }

  function sendMessage(data: string): void {
    const { onMessage } = getWebViewProps()
    const event = { nativeEvent: { data } } as unknown as Parameters<
      NonNullable<typeof onMessage>
    >[0]
    act(() => {
      onMessage?.(event)
    })
  }

  it('loads the Messenger and its frames in place', () => {
    expect(shouldStart(SITE_URI, true)).toBe(true)
    expect(shouldStart('about:blank', true)).toBe(true)
    expect(shouldStart('https://intercom.example.com/frame', false)).toBe(true)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('sends followed links to the device browser', () => {
    expect(shouldStart('https://edge.app/fees', true)).toBe(false)
    expect(openUrl).toHaveBeenCalledWith('https://edge.app/fees')
  })

  it('never hands other schemes to the OS', () => {
    expect(shouldStart('edge://pay/abc', true)).toBe(false)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('closes when the Messenger closes', () => {
    sendMessage('hide')
    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(openBrowserUri).not.toHaveBeenCalled()
  })

  it('falls back to the support site when the Messenger cannot load', () => {
    sendMessage('error')
    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(openBrowserUri).toHaveBeenCalledWith(SITE_URI)
  })
})
