/**
 * Special mapping that defines `chain_codes` and `token_codes` for FIO tx's
 * that do not fit the typical pattern of using currency codes
 */
export const FIO_ASSET_MAP: { [pluginId: string]: { chainCode: string; tokenCodes: { [address: string]: string } } } = {
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
  }
}
