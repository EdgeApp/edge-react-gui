// @flow
import { EDGE_CONTENT_SERVER_URI } from '../constants/CdnConstants'
import { edgeDark } from '../theme/variables/edgeDark'
import { edgeLight } from '../theme/variables/edgeLight'
import { type Theme } from '../types/Theme'
import { removeHexPrefix } from './utils'

/**
 * Swap Plugin Icons
 */

export function getSwapPluginIconUri(pluginId: string, theme: Theme) {
  return `${theme.iconServerBaseUri}/exchangeIcons/${pluginId}/icon.png`
}

/**
 * Stake Provider Icons
 * Icons to differentiate multiple staking options that share the same assets.
 */
export function getStakeProviderIcon(pluginId: string, providerId: string, theme: Theme) {
  return `${theme.iconServerBaseUri}/stakeProviderIcons/${pluginId}/${providerId}/icon.png`
}

/**
 * Currency Icons
 */
export type CurrencyIcons = {
  symbolImage: string,
  symbolImageDarkMono: string
}

export function getCurrencyIconUris(pluginId: string, contractAddress?: string = pluginId): CurrencyIcons {
  const currencyPath = `${pluginId}/${removeHexPrefix(contractAddress)}`.toLowerCase()
  return {
    symbolImage: `${edgeLight.iconServerBaseUri}/currencyIcons/${currencyPath}.png`,
    symbolImageDarkMono: `${edgeDark.iconServerBaseUri}/currencyIcons/${currencyPath}_dark.png`
  }
}

/**
 * Partner Icons
 */

// TODO: Add other CDN references to the theme files to allow third-party config:
// flags, contacts, partners, etc.
// Clean up file naming scheme to be more generic, if possible.

export function getPartnerIconUri(partnerIconPath: string) {
  return `${EDGE_CONTENT_SERVER_URI}/${partnerIconPath}`
}
