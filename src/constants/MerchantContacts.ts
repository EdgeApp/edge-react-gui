import { EDGE_CONTENT_SERVER_URI } from './CdnConstants'

export interface MerchantContact {
  displayName: string
  thumbnailPath: string
  /** True for a swap, bridge or DEX provider. */
  isSwapProvider?: boolean
}

export const MERCHANT_CONTACTS: MerchantContact[] = [
  {
    displayName: '0x Gasless Swap',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/0xgasless.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Bitrefill',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/bitrefill.png`
  },
  {
    displayName: 'Bits of Gold',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/bits-of-gold-logo.png`
  },
  {
    displayName: 'Bridgeless',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/bridgeless.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Change NOW',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/changenow.png`,
    isSwapProvider: true
  },
  {
    displayName: 'ChangeHero',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/changehero.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Changelly',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/changelly.png`,
    isSwapProvider: true
  },
  {
    displayName: 'IBC Transfer',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/cosmosibc.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Fantom/Sonic Bridge',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/fantomsonicupgrade.png`,
    isSwapProvider: true
  },
  {
    displayName: 'EOS Network',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/eos-logo-solo-64.png`
  },
  {
    displayName: 'Exolix',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/exolix-logo.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Fox Exchange',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/foxEchange.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Godex',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/godex.png`,
    isSwapProvider: true
  },
  {
    displayName: 'LetsExchange',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/letsexchange-logo.png`,
    isSwapProvider: true
  },
  {
    displayName: 'LI.FI',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/lifi.png`,
    isSwapProvider: true
  },
  {
    displayName: 'MoonPay',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/moonpay_symbol_prp.png`
  },
  {
    displayName: 'MoonPay Trade (Centralized)',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/exchangeIcons/mptrade/icon.png`,
    isSwapProvider: true
  },
  {
    displayName: 'MoonPay Trade (DeFi)',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/exchangeIcons/mptradedefi/icon.png`,
    isSwapProvider: true
  },
  {
    displayName: 'ShapeShift',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/shapeshift.png`,
    isSwapProvider: true
  },
  {
    displayName: 'SideShift.ai',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/sideshift-logo.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Simplex',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/simplex.png`
  },
  {
    displayName: 'Swapuz',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/swapuz.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Switchain',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/switchain.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Maya Protocol',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/mayaprotocol.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Thorchain',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/thorchain.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Thorchain DEX Aggregator',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/thorchain.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Totle',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/totle-logo.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Unizen',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/unizen.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Velodrome',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/velodrome.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Visa® Prepaid Card',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/visa.png`
  },
  {
    displayName: 'Wyre',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/wyre.png`
  },
  {
    displayName: 'Xgram',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/xgram.png`,
    isSwapProvider: true
  },
  {
    displayName: 'XRP DEX',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/xrpdex.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Rango Exchange',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/rango.png`,
    isSwapProvider: true
  },
  {
    displayName: 'Phaze Gift Card',
    thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/phaze.png`
  }
]

/**
 * Display names of the contacts that are swap providers. Unlike
 * `account.swapConfig`, this set still knows a provider whose plugin failed
 * to load or has been retired.
 */
export const SWAP_PROVIDER_CONTACT_NAMES = new Set(
  MERCHANT_CONTACTS.filter(contact => contact.isSwapProvider === true).map(
    contact => contact.displayName
  )
)
