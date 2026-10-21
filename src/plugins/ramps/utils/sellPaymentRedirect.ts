import { showError } from '../../../components/services/AirshipInstance'
import { isReturnUrl } from '../../gui/providers/common'

export interface SellPaymentRedirect {
  /** Pass to the sell widget's WebView as `onShouldStartLoad`. */
  onShouldStartLoad: (url: string) => boolean
  /** Hand every URL the sell widget's WebView reports to this. */
  onUrlChange: (url: string) => Promise<void>
  /**
   * Call once the send scene closed with nothing sent. Closes the redirect
   * page if the WebView loaded it, and otherwise leaves the WebView on the
   * provider's page for the order.
   */
  closeRedirectPage: () => void
}

/**
 * Opens the send scene from a sell widget's payment redirect, keeping the
 * WebView on the provider's page for the order.
 *
 * The WebView refuses the redirect, which leads to a web fallback page meant
 * for outside the app. Android stops waiting for that answer after 250ms and
 * loads the page anyway, so its URL report opens the send scene instead. The
 * page reports its URL more than once while it loads, and a later report can
 * arrive after Back, so only the first report may open the send scene.
 *
 * @param params.navigation - Pops the redirect page in `closeRedirectPage`
 * @param params.onPaymentRedirect - Opens the send scene for the redirect URL
 */
export function makeSellPaymentRedirect(params: {
  navigation: { pop: () => void }
  onPaymentRedirect: (url: string) => Promise<void>
}): SellPaymentRedirect {
  const { navigation, onPaymentRedirect } = params

  // Set once the WebView itself has loaded the redirect page:
  let webViewOnRedirectPage = false

  return {
    onShouldStartLoad(url) {
      if (!isReturnUrl(url, 'payment')) return true
      onPaymentRedirect(url).catch((error: unknown) => {
        showError(error)
      })
      return false
    },

    async onUrlChange(url) {
      if (!isReturnUrl(url, 'payment')) return
      if (webViewOnRedirectPage) return
      webViewOnRedirectPage = true
      await onPaymentRedirect(url)
    },

    closeRedirectPage() {
      if (webViewOnRedirectPage) navigation.pop()
    }
  }
}
