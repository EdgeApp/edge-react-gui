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

export type LinkHandler = (url: RampLink) => void | Promise<void>

interface DeeplinkListener {
  direction: FiatDirection
  providerId: string
  deeplinkHandler: LinkHandler
}

class RampDeeplinkManager {
  private listener: DeeplinkListener | null = null

  register(
    direction: FiatDirection,
    providerId: string,
    deeplinkHandler: LinkHandler
  ): void {
    this.listener = { direction, providerId, deeplinkHandler }
  }

  unregister(): void {
    this.listener = null
  }

  handleDeeplink(link: RampLink): boolean {
    if (this.listener == null) return false
    const { direction, providerId, deeplinkHandler } = this.listener
    if (link.providerId !== providerId) return false
    if (link.direction !== direction) return false
    if (Platform.OS === 'ios') SafariView.dismiss()
    this.unregister()

    // Handle the promise and catch any errors
    const result = deeplinkHandler(link)
    if (result instanceof Promise) {
      result.catch((error: unknown) => {
        showError(error)
      })
    }

    return true
  }
}

export const rampDeeplinkManager = new RampDeeplinkManager()
