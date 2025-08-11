import { Platform } from 'react-native'
import SafariView from 'react-native-safari-view'

import { showError } from '../../components/services/AirshipInstance'
import type { FiatProviderLink } from '../../types/DeepLinkTypes'
import type { FiatDirection, LinkHandler } from '../gui/fiatPluginTypes'

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

  handleDeeplink(link: FiatProviderLink): void {
    if (this.listener == null) {
      showError(
        `No buy/sell interface currently open to handle fiatProvider deeplink`
      )
      return
    }
    const { direction, providerId, deeplinkHandler } = this.listener
    if (link.providerId !== providerId) {
      showError(
        `Deeplink providerId ${link.providerId} does not match expected providerId ${providerId}`
      )
      return
    }

    if (link.direction !== direction) {
      showError(
        `Deeplink direction ${link.direction} does not match expected direction ${direction}`
      )
      return
    }

    // Close the SafariView if it's open. Otherwise we can't see the Edge app interface
    if (Platform.OS === 'ios') {
      SafariView.dismiss()
    }
    deeplinkHandler(link)
  }
}

export const rampDeeplinkManager = new RampDeeplinkManager()
