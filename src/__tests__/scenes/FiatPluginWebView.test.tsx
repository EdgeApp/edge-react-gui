import { describe, expect, it, jest } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import { WebView } from 'react-native-webview'

import { FiatPluginWebViewComponent } from '../../plugins/gui/scenes/FiatPluginWebView'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeSellTabSceneProps } from '../../util/fake/fakeSceneProps'

// A logged-in DFX sell opens with its login token in the query:
const URL_WITH_SESSION =
  'https://app.dfx.swiss/sell?blockchain=Bitcoin&session=jwt-secret'

describe('FiatPluginWebViewComponent', () => {
  it('logs a failed page load without the login token', () => {
    const rendered = render(
      <FakeProviders>
        <FiatPluginWebViewComponent
          {...fakeSellTabSceneProps('guiPluginWebView', {
            url: URL_WITH_SESSION,
            onClose: () => {}
          })}
        />
      </FakeProviders>
    )
    const { onError }: React.ComponentProps<typeof WebView> =
      rendered.UNSAFE_getByType(WebView).props
    // Android reports the URL as the title too, before the page sets its own:
    const event = {
      nativeEvent: {
        url: URL_WITH_SESSION,
        title: URL_WITH_SESSION,
        code: -1009,
        description: 'The Internet connection appears to be offline.'
      }
    } as unknown as Parameters<NonNullable<typeof onError>>[0]
    jest.mocked(console.warn).mockClear()

    onError?.(event)

    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith(
      'FiatPluginWebView load error: ',
      'https://app.dfx.swiss/sell?blockchain=Bitcoin&session=redacted',
      -1009,
      'The Internet connection appears to be offline.'
    )
    expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain(
      'jwt-secret'
    )
    rendered.unmount()
  })
})
