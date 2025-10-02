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

class RampDeeplinkManager {
  private listener: DeeplinkListener | null = null

  register(
    direction: FiatDirection,
    providerId: string,
    deeplinkHandler: RampLinkHandler
  ): void {
    this.listener = { direction, providerId, deeplinkHandler }
  }

  unregister(): void {
    this.listener = null
  }

  handleDeeplink(
    link: RampLink
  ): { success: true } | { success: false; error: string } {
    if (this.listener == null) {
      return {
        success: false,
        error: 'No buy/sell interface currently open to handle ramp deeplink'
      }
    }
    if (link.providerId !== this.listener.providerId) {
      return {
        success: false,
        error: `Deeplink providerId '${link.providerId}' does not match expected providerId '${this.listener.providerId}'`
      }
    }

    if (link.direction !== this.listener.direction) {
      return {
        success: false,
        error: `Deeplink direction '${link.direction}' does not match expected direction '${this.listener.direction}'`
      }
    }

    // Close the SafariView if it's open. Otherwise we can't see the Edge app interface
    if (Platform.OS === 'ios') {
      SafariView.dismiss()
    }

    // Handle the promise and catch any errors
    const result = this.listener.deeplinkHandler(link)
    if (result != null) {
      result.catch(showError)
    }

    this.unregister()

    return { success: true }
  }
}

export const rampDeeplinkManager = new RampDeeplinkManager()
