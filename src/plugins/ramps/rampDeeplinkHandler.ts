import { Platform } from 'react-native'
import SafariView from 'react-native-safari-view'

import { showError } from '../../components/services/AirshipInstance'

// Copied types to decouple from gui/
export type FiatDirection = 'buy' | 'sell'

export interface RampLink {
  type: 'ramp'
  direction: FiatDirection
  providerId: string
  path: string
  query: Record<string, string | null>
  uri: string
}

export type RampLinkHandler = (url: RampLink) => void | Promise<void>

interface DeeplinkListener {
  direction: FiatDirection
  providerId: string
  deeplinkHandler: RampLinkHandler
}

let nextToken = 0

class RampDeeplinkManager {
  private readonly listeners = new Map<string, DeeplinkListener>()

  register(
    direction: FiatDirection,
    providerId: string,
    deeplinkHandler: RampLinkHandler
  ): string {
    const token = String(++nextToken)
    this.listeners.set(token, { direction, providerId, deeplinkHandler })
    return token
  }

  unregister(token: string): void {
    this.listeners.delete(token)
  }

  handleDeeplink(
    link: RampLink
  ): { success: true } | { success: false; error: string } {
    // Find the most recently registered listener matching providerId + direction
    let matchedToken: string | undefined
    let matchedListener: DeeplinkListener | undefined
    for (const [token, listener] of this.listeners) {
      if (
        listener.providerId === link.providerId &&
        listener.direction === link.direction
      ) {
        matchedToken = token
        matchedListener = listener
      }
    }

    if (matchedToken == null || matchedListener == null) {
      return {
        success: false,
        error:
          this.listeners.size === 0
            ? 'No buy/sell interface currently open to handle ramp deeplink'
            : `No listener matching providerId '${link.providerId}' direction '${link.direction}'`
      }
    }

    // Close the SafariView if it's open. Otherwise we can't see the Edge app interface
    if (Platform.OS === 'ios') {
      SafariView.dismiss()
    }

    // Handle the promise and catch any errors
    const result = matchedListener.deeplinkHandler(link)
    if (result != null) {
      result.catch((error: unknown) => {
        showError(error)
      })
    }

    this.listeners.delete(matchedToken)

    return { success: true }
  }
}

export const rampDeeplinkManager = new RampDeeplinkManager()
