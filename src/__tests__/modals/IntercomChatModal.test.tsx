import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import * as React from 'react'
import { Linking } from 'react-native'
import { WebView } from 'react-native-webview'

import {
  getIntercomChatHtml,
  IntercomChatModal
} from '../../components/modals/IntercomChatModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { openBrowserUri } from '../../util/WebUtils'

jest.mock('../../util/WebUtils', () => ({
  openBrowserUri: jest.fn(async () => {})
}))

const API_BASE = 'https://api-iam.example.com'
const SITE_URI = 'https://support.example.com/chat'

describe('getIntercomChatHtml', () => {
  it('passes the app details to Intercom as attributes', () => {
    const html = getIntercomChatHtml('abc123', API_BASE, {
      edge_app_version: '4.53.0'
    })

    expect(html).toContain('"app_id":"abc123"')
    expect(html).toContain('"edge_app_version":"4.53.0"')
    expect(html).toContain('https://widget.intercom.io/widget/abc123')
  })

  it('talks to the given Messenger host', () => {
    const html = getIntercomChatHtml('abc123', API_BASE, {})

    expect(html).toContain(`"api_base":"${API_BASE}"`)
  })

  it('opens the Messenger on the composer', () => {
    const html = getIntercomChatHtml('abc123', API_BASE, {})

    expect(html).toContain("Intercom('showNewMessage')")
    expect(html).toContain('var message = null')
  })

  it('sends the attributes as an update once the Messenger shows', () => {
    const html = getIntercomChatHtml('abc123', API_BASE, { edge_lock_id: null })

    expect(html).toContain(
      `window.intercomSettings = {"api_base":"${API_BASE}","app_id":"abc123","hide_default_launcher":true}`
    )
    expect(html).toContain('var attributes = {"edge_lock_id":null}')
    expect(html).toContain("Intercom('update', attributes)")
  })

  it('sends the given message through the composer', () => {
    const html = getIntercomChatHtml(
      'abc123',
      API_BASE,
      {},
      'Lock ID: "1a2b3c4d"'
    )

    expect(html).toContain("Intercom('showNewMessage')")
    expect(html).toContain('var message = "Lock ID: \\"1a2b3c4d\\""')
    expect(html).toContain("doc.execCommand('insertText', false, message)")
    expect(html).toContain('.intercom-composer-send-button')
  })

  it('keeps attribute values inside the script tag', () => {
    const html = getIntercomChatHtml('abc123', API_BASE, {
      edge_app_version: '</script><script>alert(1)</script>'
    })

    expect(html).not.toContain('</script><script>alert(1)')
  })

  it('keeps the message inside the script tag', () => {
    const html = getIntercomChatHtml(
      'abc123',
      API_BASE,
      {},
      '</script><script>alert(1)</script>'
    )

    expect(html).not.toContain('</script><script>alert(1)')
  })
})

describe('getIntercomChatHtml page script', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  // Runs the page script against a queued Intercom and a stub Messenger frame:
  function loadPage(message?: string): {
    calls: () => unknown[][]
    click: jest.Mock
    insertText: jest.Mock
    postMessage: jest.Mock
    show: () => void
  } {
    const html = getIntercomChatHtml(
      'abc123',
      API_BASE,
      { edge_lock_id: '1a2b3c4d' },
      message
    )
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? ''
    const insertText = jest.fn()
    const click = jest.fn()
    const postMessage = jest.fn()
    const messenger = {
      execCommand: insertText,
      querySelector: (selector: string) =>
        selector === '.intercom-composer-send-button'
          ? { click }
          : { focus() {} }
    }
    const fakeWindow: {
      Intercom?: { q: IArguments[] }
      ReactNativeWebView: { postMessage: jest.Mock }
    } = { ReactNativeWebView: { postMessage } }
    const fakeDocument = {
      createElement: () => ({}),
      head: { appendChild() {} },
      querySelector: () => ({ contentDocument: messenger })
    }
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
    new Function('window', 'document', script)(fakeWindow, fakeDocument)
    const calls = (): unknown[][] =>
      (fakeWindow.Intercom?.q ?? []).map(args => Array.from(args))
    const show = calls().find(call => call[0] === 'onShow')?.[1] as () => void
    return { calls, click, insertText, postMessage, show }
  }

  it('updates and sends once per page', () => {
    jest.useFakeTimers()
    const page = loadPage('Hi')
    page.show()
    page.show()
    jest.advanceTimersByTime(300)

    expect(page.calls().filter(call => call[0] === 'update')).toEqual([
      ['update', { edge_lock_id: '1a2b3c4d' }]
    ])
    expect(page.insertText).toHaveBeenCalledWith('insertText', false, 'Hi')
    expect(page.insertText).toHaveBeenCalledTimes(1)
    expect(page.click).toHaveBeenCalledTimes(1)
    expect(
      page.postMessage.mock.calls.filter(call => call[0] === 'sent')
    ).toHaveLength(1)
  })

  it('sends nothing without a message', () => {
    jest.useFakeTimers()
    const page = loadPage()
    page.show()
    jest.advanceTimersByTime(300)

    expect(page.insertText).not.toHaveBeenCalled()
    expect(page.click).not.toHaveBeenCalled()
    expect(page.postMessage).not.toHaveBeenCalledWith('sent')
  })
})

describe('IntercomChatModal', () => {
  const bridge = { ...fakeAirshipBridge, resolve: jest.fn() }
  const openUrl = jest.spyOn(Linking, 'openURL')

  beforeEach(() => {
    jest.clearAllMocks()
    openUrl.mockResolvedValue(undefined)
  })

  function getWebViewProps(
    extraProps: Partial<React.ComponentProps<typeof IntercomChatModal>> = {}
  ): React.ComponentProps<typeof WebView> {
    const rendered = render(
      <FakeProviders>
        <IntercomChatModal
          bridge={bridge}
          appId="abc123"
          siteUri={SITE_URI}
          {...extraProps}
        />
      </FakeProviders>
    )
    return rendered.UNSAFE_getByType(WebView).props
  }

  function getHtml(
    extraProps: Partial<React.ComponentProps<typeof IntercomChatModal>> = {}
  ): string {
    const { source } = getWebViewProps(extraProps)
    return (source as { html: string }).html
  }

  function shouldStart(url: string, isTopFrame: boolean): boolean | undefined {
    const { onShouldStartLoadWithRequest } = getWebViewProps()
    const event = { url, isTopFrame } as unknown as Parameters<
      NonNullable<typeof onShouldStartLoadWithRequest>
    >[0]
    return onShouldStartLoadWithRequest?.(event)
  }

  function openWindow(targetUrl: string): void {
    const { onOpenWindow } = getWebViewProps()
    const event = { nativeEvent: { targetUrl } } as unknown as Parameters<
      NonNullable<typeof onOpenWindow>
    >[0]
    onOpenWindow?.(event)
  }

  function loadStart(url: string): void {
    const { onLoadStart } = getWebViewProps()
    const event = { nativeEvent: { url } } as unknown as Parameters<
      NonNullable<typeof onLoadStart>
    >[0]
    act(() => {
      onLoadStart?.(event)
    })
  }

  function sendMessage(
    data: string,
    extraProps: Partial<React.ComponentProps<typeof IntercomChatModal>> = {}
  ): void {
    const { onMessage } = getWebViewProps(extraProps)
    const event = { nativeEvent: { data } } as unknown as Parameters<
      NonNullable<typeof onMessage>
    >[0]
    act(() => {
      onMessage?.(event)
    })
  }

  it('lets only the chat use the microphone', () => {
    expect(getWebViewProps().mediaCapturePermissionGrantType).toBe(
      'grantIfSameHostElsePrompt'
    )
  })

  it('sends the OS version string, not the Android API level', () => {
    expect(getHtml()).toContain('"edge_os_version":"18.0.0"')
  })

  it('uses the US Messenger host unless told otherwise', () => {
    expect(getHtml()).toContain('"api_base":"https://api-iam.intercom.io"')
    expect(getHtml({ apiBase: API_BASE })).toContain(`"api_base":"${API_BASE}"`)
  })

  it('sends the Lock ID and the message along with the app details', () => {
    const html = getHtml({ lockId: '1a2b3c4d', message: 'Help' })

    expect(html).toContain('"edge_lock_id":"1a2b3c4d"')
    expect(html).toContain('"edge_os_version":"18.0.0"')
    expect(html).toContain('var message = "Help"')
  })

  it('clears the Lock ID when the chat has none', () => {
    expect(getHtml()).toMatch(/var attributes = \{[^}]*"edge_lock_id":null/)
  })

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

  it('never opens web links the OS routes back into the app', () => {
    expect(shouldStart('https://deep.edge.app/pay/abc', true)).toBe(false)
    expect(shouldStart('https://DL.edge.app/?af=x', true)).toBe(false)
    expect(shouldStart('http://return.edge.app/x', true)).toBe(false)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('opens new-window links through the same gate', () => {
    openWindow('edge://pay/abc')
    openWindow('https://deep.edge.app/pay/abc')
    expect(openUrl).not.toHaveBeenCalled()

    openWindow('https://edge.app/fees')
    expect(openUrl).toHaveBeenCalledWith('https://edge.app/fees')
  })

  it('keeps the chat while the page is the Messenger', () => {
    loadStart(SITE_URI)
    loadStart('about:blank')
    loadStart(`${SITE_URI}#intercom`)
    expect(bridge.resolve).not.toHaveBeenCalled()
  })

  it('closes when another page loads in place of the Messenger', () => {
    loadStart('https://evil.example.com/')
    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('closes when the Messenger closes', () => {
    sendMessage('hide')
    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(openBrowserUri).not.toHaveBeenCalled()
  })

  it('reports the message once the page has sent it', () => {
    const onMessageSent = jest.fn()
    sendMessage('show', { message: 'Hi', onMessageSent })
    expect(onMessageSent).not.toHaveBeenCalled()

    sendMessage('sent', { message: 'Hi', onMessageSent })
    expect(onMessageSent).toHaveBeenCalledTimes(1)
  })

  it('falls back to the support site when the Messenger cannot load', () => {
    sendMessage('error')
    expect(bridge.resolve).toHaveBeenCalledTimes(1)
    expect(openBrowserUri).toHaveBeenCalledWith(SITE_URI)
  })

  describe('when the Messenger is slow to open', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('falls back to the support site', () => {
      getWebViewProps()
      act(() => {
        jest.advanceTimersByTime(20000)
      })

      expect(bridge.resolve).toHaveBeenCalledTimes(1)
      expect(openBrowserUri).toHaveBeenCalledWith(SITE_URI)
    })

    it('stays closed once the user closes the chat', () => {
      sendMessage('hide')
      act(() => {
        jest.advanceTimersByTime(20000)
      })

      expect(bridge.resolve).toHaveBeenCalledTimes(1)
      expect(openBrowserUri).not.toHaveBeenCalled()
    })

    it('keeps the chat once it opens', () => {
      sendMessage('show')
      act(() => {
        jest.advanceTimersByTime(60000)
      })

      expect(bridge.resolve).not.toHaveBeenCalled()
      expect(openBrowserUri).not.toHaveBeenCalled()
    })
  })
})
