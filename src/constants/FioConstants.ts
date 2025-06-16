/**
 * Special mapping that defines `chain_codes` and `token_codes` for FIO tx's
 * that do not fit the typical pattern of using currency codes
 */

export interface FioAsset {
  chainCode: string
  tokenCodes: { [address: string]: string }
}
export const FIO_ASSET_MAP: { [pluginId: string]: FioAsset } = {
  abstract: {
    chainCode: 'ABSTRACT',
    tokenCodes: {}
  },
  ethereumpo: {
    chainCode: 'ETHEREUMPO',
    tokenCodes: {}
  },
  optimism: {
    chainCode: 'OPT',
    tokenCodes: {}
  },
  bobevm: {
    chainCode: 'BOBNETWORK',
    tokenCodes: {}
  },
  zksync: {
    chainCode: 'ZKSYNC',
    tokenCodes: {}
  },
  binancesmartchain: {
    chainCode: 'BSC',
    tokenCodes: {}
  },
  sonic: {
    chainCode: 'SONIC',
    tokenCodes: {}
  },
  ripple: {
    chainCode: 'XRP',
    tokenCodes: {
      'USD-rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq': 'USDGH',
      'EUR-rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq': 'EURGH',
      'USD-rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B': 'USDBS',
      'EUR-rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B': 'EURBS',
      'USD-rEn9eRkX25wfGPLysUMAvZ84jAzFNpT5fL': 'USDST'
    }
  }
}
