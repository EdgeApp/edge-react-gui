/**
 * How long a webview has to settle after going back before landing on the
 * page it left counts as a redirect bouncing it there.
 */
export const BACK_SETTLE_MS = 1500

export interface PluginBackHistory {
  /** Records each page the webview reports, with its `canGoBack`. */
  onNavigation: (url: string, canGoBack: boolean) => void
  /**
   * True when the webview should go back. False when the button should
   * leave the scene instead: the webview has no history, or an earlier
   * press has not moved it yet.
   */
  pressBack: () => boolean
  /** Drops a pending check, as when the scene loses focus. */
  cancel: () => void
}

/**
 * Decides what the plugin back button does with a webview's history. A web
 * app that redirects its entry URL keeps that URL in the history: DFX sends
 * a visitor who is not logged in from its deep link to its login page, so
 * the webview reports it can go back, and going back only lands on the
 * login page again. When a back press ends on the page it started from, the
 * history held nothing to go back to, so this calls `leave`.
 */
export function makePluginBackHistory(leave: () => void): PluginBackHistory {
  let canGoBack = false
  let page = ''
  let pending: ReturnType<typeof setTimeout> | undefined
  let pendingFrom = ''

  const cancel = (): void => {
    if (pending != null) clearTimeout(pending)
    pending = undefined
  }

  return {
    onNavigation(url, webViewCanGoBack) {
      canGoBack = webViewCanGoBack
      page = pageOf(url)
    },

    pressBack() {
      if (!canGoBack) return false
      // Another press before the last one settled, with the webview still
      // where that press started: going back has done nothing the user can
      // see, so leave now rather than make them wait out the check again:
      if (pending != null && page === pendingFrom) {
        cancel()
        return false
      }
      cancel()
      pendingFrom = page
      pending = setTimeout(() => {
        pending = undefined
        if (page === pendingFrom) leave()
      }, BACK_SETTLE_MS)
      return true
    },

    cancel
  }
}

/** The URL without its query, which a redirect can change: */
function pageOf(url: string): string {
  return url.replace(/\?[^#]*/, '')
}
