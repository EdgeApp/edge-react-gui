// @flow
/* globals describe test expect */

import { getReturnCurrencyCode, upgradeExtendedCurrencyCodes } from '../modules/UI/scenes/Plugins/EdgeProvider.js'

describe('upgradeExtendedCurrencyCodes', () => {
  describe('string list', () => {
    test('empty array', () => {
      // MATIC and BNB are ambiguous since they could be an ETH token or a mainnet coin. Therefore it should not get included
      // As well, BSC is not an actual currencyCode so it won't be included either. BSC can only be specified using object
      // params with pluginId = binancesmartchain
      const result = upgradeExtendedCurrencyCodes(currencyConfig, undefined, [])
      expect(result).toEqual(undefined)
    })
    test('undefined', () => {
      // MATIC and BNB are ambiguous since they could be an ETH token or a mainnet coin. Therefore it should not get included
      // As well, BSC is not an actual currencyCode so it won't be included either. BSC can only be specified using object
      // params with pluginId = binancesmartchain
      const result = upgradeExtendedCurrencyCodes(currencyConfig, undefined, undefined)
      expect(result).toEqual(undefined)
    })
    test('mainnets', () => {
      // MATIC and BNB are ambiguous since they could be an ETH token or a mainnet coin. Therefore it should not get included
      // As well, BSC is not an actual currencyCode so it won't be included either. BSC can only be specified using object
      // params with pluginId = binancesmartchain
      const result = upgradeExtendedCurrencyCodes(currencyConfig, undefined, ['BTC', 'ETH', 'MATIC', 'BNB', 'DOGE', 'BSC'])
      expect(result).toEqual([{ pluginId: 'bitcoin' }, { pluginId: 'ethereum' }, { pluginId: 'dogecoin' }])
    })
    test('single code tokens', () => {
      const result = upgradeExtendedCurrencyCodes(currencyConfig, undefined, ['BTC', 'USDC', 'REP', 'USDT'])
      expect(result).toEqual([
        { pluginId: 'bitcoin' },
        { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
        { pluginId: 'ethereum', tokenId: '1985365e9f78359a9b6ad760e32412f4a445e862' },
        { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' }
      ])
    })
    test('double code tokens', () => {
      const result = upgradeExtendedCurrencyCodes(currencyConfig, undefined, ['BTC', 'MATIC-USDC', 'ETH-REP', 'ETH-USDT'])
      expect(result).toEqual([
        { pluginId: 'bitcoin' },
        { pluginId: 'polygon', tokenId: '2791bca1f2de4661ed88a30c99a7a9449aa84174' },
        { pluginId: 'ethereum', tokenId: '1985365e9f78359a9b6ad760e32412f4a445e862' },
        { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' }
      ])
    })
    test('object list', () => {
      const result = upgradeExtendedCurrencyCodes(currencyConfig, undefined, [
        { pluginId: 'bitcoin', tokenId: undefined, currencyCode: undefined },
        { pluginId: 'polygon', tokenId: undefined, currencyCode: 'USDC' },
        { pluginId: 'ethereum', tokenId: undefined, currencyCode: 'REP' },
        { pluginId: 'ethereum', tokenId: undefined, currencyCode: 'USDT' },
        { pluginId: 'ethereum', tokenId: undefined, currencyCode: 'MATIC' }
      ])
      expect(result).toEqual([
        { pluginId: 'bitcoin' },
        { pluginId: 'polygon', tokenId: '2791bca1f2de4661ed88a30c99a7a9449aa84174' },
        { pluginId: 'ethereum', tokenId: '1985365e9f78359a9b6ad760e32412f4a445e862' },
        { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
        { pluginId: 'ethereum', tokenId: '7d1afa7b718fb893db30a3abc0cfc608aacfebb0' }
      ])
    })
    test('single code tokens with fixes', () => {
      const result = upgradeExtendedCurrencyCodes(
        currencyConfig,
        { USDTERC20: { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' } },
        ['BTC', 'USDC', 'REP', 'USDTERC20']
      )
      expect(result).toEqual([
        { pluginId: 'bitcoin' },
        { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
        { pluginId: 'ethereum', tokenId: '1985365e9f78359a9b6ad760e32412f4a445e862' },
        { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' }
      ])
    })
  })
})

describe('getReturnCurrencyCode', () => {
  describe('string list', () => {
    test('mainnets', () => {
      const result = getReturnCurrencyCode(['BTC', 'ETH', 'MATIC'], 'ETH', 'ETH')
      expect(result).toBe('ETH')
    })
    test('eth token', () => {
      const result = getReturnCurrencyCode(['BTC', 'ETH', 'USDC'], 'ETH', 'USDC')
      expect(result).toBe('USDC')
    })
    test('double code mainnet', () => {
      const result = getReturnCurrencyCode(['BTC-BTC', 'ETH-ETH', 'ETH-USDC'], 'ETH', 'ETH')
      expect(result).toBe('ETH-ETH')
    })
    test('double code ETH token', () => {
      const result = getReturnCurrencyCode(['BTC-BTC', 'ETH-ETH', 'ETH-USDC'], 'ETH', 'USDC')
      expect(result).toBe('ETH-USDC')
    })
    test('double code token', () => {
      const result = getReturnCurrencyCode(['BTC-BTC', 'ETH-ETH', 'ETH-USDC', 'MATIC-USDC'], 'MATIC', 'USDC')
      expect(result).toBe('MATIC-USDC')
    })
  })
})

const currencyConfig = {
  eos: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'EOS',
      displayName: 'EOS',
      pluginId: 'eos',
      pluginName: 'eos',
      walletType: 'wallet:eos',
      defaultSettings: {
        otherSettings: {
          eosActivationServers: ['https://eospay.edge.app'],
          eosHyperionNodes: ['https://api.eossweden.org'],
          eosNodes: [
            'https://api.eoseoul.io',
            'https://api.eoslaomao.com',
            'https://mainnet.eoscannon.io',
            'https://api.eos.wiki',
            'https://mainnet.eosio.sg',
            'https://eos.newdex.one',
            'https://api.bitmars.one',
            'https://node1.zbeos.com',
            'https://api.eosn.io'
          ],
          eosFuelServers: ['https://eos.greymass.com'],
          eosDfuseServers: ['https://eos.dfuse.eosnation.io'],
          uriProtocol: 'eos',
          fuelActions: [
            {
              authorization: [
                {
                  actor: 'greymassfuel',
                  permission: 'cosign'
                }
              ],
              account: 'greymassnoop',
              name: 'noop',
              data: {}
            }
          ]
        }
      },
      memoMaxLength: 256,
      addressExplorer: 'https://bloks.io/account/%s',
      transactionExplorer: 'https://bloks.io/transaction/%s',
      denominations: [
        {
          name: 'EOS',
          multiplier: '10000',
          symbol: 'E'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  telos: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'TLOS',
      displayName: 'Telos',
      pluginId: 'telos',
      pluginName: 'telos',
      walletType: 'wallet:telos',
      defaultSettings: {
        otherSettings: {
          eosActivationServers: ['https://eospay.edge.app', 'https://account.teloscrew.com'],
          eosHyperionNodes: ['https://telos.caleos.io'],
          eosNodes: ['https://telos.caleos.io'],
          eosFuelServers: [],
          eosDfuseServers: [],
          uriProtocol: 'telos'
        }
      },
      memoMaxLength: 256,
      addressExplorer: 'https://telos.bloks.io/account/%s',
      transactionExplorer: 'https://telos.bloks.io/transaction/%s',
      denominations: [
        {
          name: 'TLOS',
          multiplier: '10000',
          symbol: 'T'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  wax: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'WAX',
      displayName: 'Wax',
      pluginId: 'wax',
      pluginName: 'wax',
      walletType: 'wallet:wax',
      defaultSettings: {
        otherSettings: {
          eosActivationServers: [],
          eosHyperionNodes: ['https://api.waxsweden.org'],
          eosNodes: ['https://api.waxsweden.org'],
          eosFuelServers: [],
          eosDfuseServers: [],
          uriProtocol: 'wax',
          createAccountViaSingleApiEndpoints: ['https://edge.maltablock.org/api/v1/activateAccount']
        }
      },
      memoMaxLength: 256,
      addressExplorer: 'https://wax.bloks.io/account/%s',
      transactionExplorer: 'https://wax.bloks.io/transaction/%s',
      denominations: [
        {
          name: 'WAX',
          multiplier: '100000000',
          symbol: 'W'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  binancesmartchain: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'BNB',
      displayName: 'BNB Smart Chain',
      pluginId: 'binancesmartchain',
      walletType: 'wallet:binancesmartchain',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: ['https://bsc-dataseed.binance.org', 'https://bsc-dataseed1.defibit.io', 'https://bsc-dataseed1.ninicoin.io'],
          evmScanApiServers: ['https://api.bscscan.com'],
          blockcypherApiServers: [],
          blockbookServers: [],
          uriNetworks: ['smartchain'],
          ercTokenStandard: 'ERC20',
          chainParams: {
            chainId: 56,
            name: 'Binance Smart Chain'
          },
          hdPathCoinType: 60,
          checkUnconfirmedTransactions: false,
          iosAllowedTokens: {},
          blockchairApiServers: [],
          alethioApiServers: [],
          alethioCurrencies: null,
          amberdataRpcServers: [],
          amberdataApiServers: [],
          amberDataBlockchainId: '',
          pluginMnemonicKeyName: 'binancesmartchainMnemonic',
          pluginRegularKeyName: 'binancesmartchainKey',
          ethGasStationUrl: null,
          defaultNetworkFees: {
            default: {
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '200000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '1000000001',
                standardFeeLow: '40000000001',
                standardFeeHigh: '300000000001',
                standardFeeLowAmount: '100000000000000000',
                standardFeeHighAmount: '10000000000000000000',
                highFee: '40000000001',
                minGasPrice: '1000000000'
              }
            }
          }
        }
      },
      addressExplorer: 'https://bscscan.com/address/%s',
      transactionExplorer: 'https://bscscan.com/tx/%s',
      denominations: [
        {
          name: 'BNB',
          multiplier: '1000000000000000000',
          symbol: 'BNB'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  ethereum: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'ETH',
      displayName: 'Ethereum',
      pluginId: 'ethereum',
      walletType: 'wallet:ethereum',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: ['https://eth-mainnet.alchemyapi.io', 'https://mainnet.infura.io/v3', 'https://cloudflare-eth.com'],
          evmScanApiServers: ['https://api.etherscan.io'],
          blockcypherApiServers: ['https://api.blockcypher.com'],
          blockbookServers: ['https://blockbook-ethereum.tronwallet.me', 'https://eth1.trezor.io', 'https://eth2.trezor.io', 'https://eth2.bcfn.ca'],
          uriNetworks: ['ethereum', 'ether'],
          ercTokenStandard: 'ERC20',
          chainParams: {
            chainId: 1,
            name: 'Ethereum Mainnet'
          },
          supportsEIP1559: true,
          hdPathCoinType: 60,
          checkUnconfirmedTransactions: true,
          iosAllowedTokens: {
            REP: true,
            WINGS: true,
            HUR: true,
            IND: true,
            USDT: true
          },
          blockchairApiServers: ['https://api.blockchair.com'],
          alethioApiServers: ['https://api.aleth.io/v1'],
          alethioCurrencies: {
            native: 'ether',
            token: 'token'
          },
          amberdataRpcServers: ['https://rpc.web3api.io'],
          amberdataApiServers: ['https://web3api.io/api/v2'],
          amberDataBlockchainId: '1c9c969065fcd1cf',
          pluginMnemonicKeyName: 'ethereumMnemonic',
          pluginRegularKeyName: 'ethereumKey',
          ethGasStationUrl: 'https://www.ethgasstation.info/json/ethgasAPI.json',
          defaultNetworkFees: {
            default: {
              baseFeeMultiplier: {
                lowFee: '1',
                standardFeeLow: '1.25',
                standardFeeHigh: '1.5',
                highFee: '1.75'
              },
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '300000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '1000000001',
                standardFeeLow: '40000000001',
                standardFeeHigh: '300000000001',
                standardFeeLowAmount: '100000000000000000',
                standardFeeHighAmount: '10000000000000000000',
                highFee: '40000000001',
                minGasPrice: '1000000000'
              },
              minPriorityFee: '2000000000'
            },
            '1983987abc9837fbabc0982347ad828': {
              gasLimit: {
                regularTransaction: '21002',
                tokenTransaction: '37124'
              },
              gasPrice: {
                lowFee: '1000000002',
                standardFeeLow: '40000000002',
                standardFeeHigh: '300000000002',
                standardFeeLowAmount: '200000000000000000',
                standardFeeHighAmount: '20000000000000000000',
                highFee: '40000000002'
              }
            },
            '2983987abc9837fbabc0982347ad828': {
              gasLimit: {
                regularTransaction: '21002',
                tokenTransaction: '37124'
              }
            }
          }
        }
      },
      addressExplorer: 'https://etherscan.io/address/%s',
      transactionExplorer: 'https://etherscan.io/tx/%s',
      denominations: [
        {
          name: 'ETH',
          multiplier: '1000000000000000000',
          symbol: 'Ξ'
        },
        {
          name: 'mETH',
          multiplier: '1000000000000000',
          symbol: 'mΞ'
        }
      ],
      metaTokens: [
        {
          currencyCode: 'REP',
          currencyName: 'Augur',
          denominations: [
            {
              name: 'REP',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x1985365e9f78359a9B6AD760e32412f4a445E862'
        },
        {
          currencyCode: 'REPV2',
          currencyName: 'Augur v2',
          denominations: [
            {
              name: 'REPV2',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x221657776846890989a759BA2973e427DfF5C9bB'
        },
        {
          currencyCode: 'HERC',
          currencyName: 'Hercules',
          denominations: [
            {
              name: 'HERC',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x2e91E3e54C5788e9FdD6A181497FDcEa1De1bcc1'
        },
        {
          currencyCode: 'DAI',
          currencyName: 'Dai Stablecoin',
          denominations: [
            {
              name: 'DAI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        },
        {
          currencyCode: 'SAI',
          currencyName: 'Sai Stablecoin',
          denominations: [
            {
              name: 'SAI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
        },
        {
          currencyCode: 'WINGS',
          currencyName: 'Wings',
          denominations: [
            {
              name: 'WINGS',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x667088b212ce3d06a1b553a7221E1fD19000d9aF'
        },
        {
          currencyCode: 'USDT',
          currencyName: 'Tether',
          denominations: [
            {
              name: 'USDT',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
        },
        {
          currencyCode: 'IND',
          currencyName: 'Indorse',
          denominations: [
            {
              name: 'IND',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xf8e386EDa857484f5a12e4B5DAa9984E06E73705'
        },
        {
          currencyCode: 'HUR',
          currencyName: 'Hurify',
          denominations: [
            {
              name: 'HUR',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xCDB7eCFd3403Eef3882c65B761ef9B5054890a47'
        },
        {
          currencyCode: 'ANTV1',
          currencyName: 'Aragon',
          denominations: [
            {
              name: 'ANTV1',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x960b236A07cf122663c4303350609A66A7B288C0'
        },
        {
          currencyCode: 'ANT',
          currencyName: 'Aragon',
          denominations: [
            {
              name: 'ANT',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xa117000000f279D81A1D3cc75430fAA017FA5A2e'
        },
        {
          currencyCode: 'BAT',
          currencyName: 'Basic Attention Token',
          denominations: [
            {
              name: 'BAT',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF'
        },
        {
          currencyCode: 'BNT',
          currencyName: 'Bancor',
          denominations: [
            {
              name: 'BNT',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C'
        },
        {
          currencyCode: 'GNT',
          currencyName: 'Golem (old)',
          denominations: [
            {
              name: 'GNT',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d'
        },
        {
          currencyCode: 'KNC',
          currencyName: 'Kyber Network',
          denominations: [
            {
              name: 'KNC',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200'
        },
        {
          currencyCode: 'POLY',
          currencyName: 'Polymath Network',
          denominations: [
            {
              name: 'POLY',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC'
        },
        {
          currencyCode: 'STORJ',
          currencyName: 'Storj',
          denominations: [
            {
              name: 'STORJ',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC'
        },
        {
          currencyCode: 'USDC',
          currencyName: 'USD Coin',
          denominations: [
            {
              name: 'USDC',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        },
        {
          currencyCode: 'USDS',
          currencyName: 'StableUSD',
          denominations: [
            {
              name: 'USDS',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0xA4Bdb11dc0a2bEC88d24A3aa1E6Bb17201112eBe'
        },
        {
          currencyCode: 'TUSD',
          currencyName: 'TrueUSD',
          denominations: [
            {
              name: 'TUSD',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x0000000000085d4780B73119b644AE5ecd22b376'
        },
        {
          currencyCode: 'ZRX',
          currencyName: '0x',
          denominations: [
            {
              name: 'ZRX',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xE41d2489571d322189246DaFA5ebDe1F4699F498'
        },
        {
          currencyCode: 'GNO',
          currencyName: 'Gnosis',
          denominations: [
            {
              name: 'GNO',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x6810e776880C02933D47DB1b9fc05908e5386b96'
        },
        {
          currencyCode: 'OMG',
          currencyName: 'OmiseGO',
          denominations: [
            {
              name: 'OMG',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
        },
        {
          currencyCode: 'NMR',
          currencyName: 'Numeraire',
          denominations: [
            {
              name: 'NMR',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671'
        },
        {
          currencyCode: 'MKR',
          currencyName: 'Maker',
          denominations: [
            {
              name: 'MKR',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'
        },
        {
          currencyCode: 'GUSD',
          currencyName: 'Gemini Dollar',
          denominations: [
            {
              name: 'GUSD',
              multiplier: '100'
            }
          ],
          contractAddress: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd'
        },
        {
          currencyCode: 'USDP',
          currencyName: 'Pax Dollar',
          denominations: [
            {
              name: 'USDP',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1'
        },
        {
          currencyCode: 'SALT',
          currencyName: 'SALT',
          denominations: [
            {
              name: 'SALT',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x4156D3342D5c385a87D264F90653733592000581'
        },
        {
          currencyCode: 'MANA',
          currencyName: 'Decentraland',
          denominations: [
            {
              name: 'MANA',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942'
        },
        {
          currencyCode: 'NEXO',
          currencyName: 'Nexo',
          denominations: [
            {
              name: 'NEXO',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206'
        },
        {
          currencyCode: 'FUN',
          currencyName: 'FunFair',
          denominations: [
            {
              name: 'FUN',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b'
        },
        {
          currencyCode: 'KIN',
          currencyName: 'Kin',
          denominations: [
            {
              name: 'KIN',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x818Fc6C2Ec5986bc6E2CBf00939d90556aB12ce5'
        },
        {
          currencyCode: 'LINK',
          currencyName: 'Chainlink',
          denominations: [
            {
              name: 'LINK',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca'
        },
        {
          currencyCode: 'BRZ',
          currencyName: 'BRZ Token',
          denominations: [
            {
              name: 'BRZ',
              multiplier: '10000'
            }
          ],
          contractAddress: '0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B'
        },
        {
          currencyCode: 'CREP',
          currencyName: 'Compound Augur',
          denominations: [
            {
              name: 'CREP',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1'
        },
        {
          currencyCode: 'CUSDC',
          currencyName: 'Compound USDC',
          denominations: [
            {
              name: 'CUSDC',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x39aa39c021dfbae8fac545936693ac917d5e7563'
        },
        {
          currencyCode: 'CETH',
          currencyName: 'Compound ETH',
          denominations: [
            {
              name: 'CETH',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'
        },
        {
          currencyCode: 'CBAT',
          currencyName: 'Compound BAT',
          denominations: [
            {
              name: 'CBAT',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'
        },
        {
          currencyCode: 'CZRX',
          currencyName: 'Compound ZRX',
          denominations: [
            {
              name: 'CZRX',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407'
        },
        {
          currencyCode: 'CWBTC',
          currencyName: 'Compound WBTC',
          denominations: [
            {
              name: 'CWBTC',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4'
        },
        {
          currencyCode: 'CSAI',
          currencyName: 'Compound SAI',
          denominations: [
            {
              name: 'CSAI',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0xf5dce57282a584d2746faf1593d3121fcac444dc'
        },
        {
          currencyCode: 'CDAI',
          currencyName: 'Compound DAI',
          denominations: [
            {
              name: 'CDAI',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        },
        {
          currencyCode: 'ETHBNT',
          currencyName: 'BNT Smart Token Relay',
          denominations: [
            {
              name: 'ETHBNT',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533'
        },
        {
          currencyCode: 'OXT',
          currencyName: 'Orchid',
          denominations: [
            {
              name: 'OXT',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x4575f41308EC1483f3d399aa9a2826d74Da13Deb'
        },
        {
          currencyCode: 'COMP',
          currencyName: 'Compound',
          denominations: [
            {
              name: 'COMP',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888'
        },
        {
          currencyCode: 'MET',
          currencyName: 'Metronome',
          denominations: [
            {
              name: 'MET',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xa3d58c4e56fedcae3a7c43a725aee9a71f0ece4e'
        },
        {
          currencyCode: 'SNX',
          currencyName: 'Synthetix Network',
          denominations: [
            {
              name: 'SNX',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
        },
        {
          currencyCode: 'SUSD',
          currencyName: 'Synthetix USD',
          denominations: [
            {
              name: 'SUSD',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'
        },
        {
          currencyCode: 'SBTC',
          currencyName: 'Synthetix BTC',
          denominations: [
            {
              name: 'SBTC',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6'
        },
        {
          currencyCode: 'AAVE',
          currencyName: 'Aave',
          denominations: [
            {
              name: 'AAVE',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
        },
        {
          currencyCode: 'AYFI',
          currencyName: 'Aave Interest Bearing YFI',
          denominations: [
            {
              name: 'AYFI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x5165d24277cd063f5ac44efd447b27025e888f37'
        },
        {
          currencyCode: 'ALINK',
          currencyName: 'Aave Interest Bearing LINK',
          denominations: [
            {
              name: 'ALINK',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xa06bc25b5805d5f8d82847d191cb4af5a3e873e0'
        },
        {
          currencyCode: 'ADAI',
          currencyName: 'Aave Interest Bearing Dai',
          denominations: [
            {
              name: 'ADAI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x028171bCA77440897B824Ca71D1c56caC55b68A3'
        },
        {
          currencyCode: 'ABAT',
          currencyName: 'Aave Interest Bearing BAT',
          denominations: [
            {
              name: 'ABAT',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1'
        },
        {
          currencyCode: 'AWETH',
          currencyName: 'Aave Interest Bearing Wrapped ETH',
          denominations: [
            {
              name: 'AWETH',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x030ba81f1c18d280636f32af80b9aad02cf0854e'
        },
        {
          currencyCode: 'AWBTC',
          currencyName: 'Aave Interest Bearing Wrapped BTC',
          denominations: [
            {
              name: 'AWBTC',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656'
        },
        {
          currencyCode: 'ASNX',
          currencyName: 'Aave Interest Bearing SNX',
          denominations: [
            {
              name: 'ASNX',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x35f6b052c598d933d69a4eec4d04c73a191fe6c2'
        },
        {
          currencyCode: 'AREN',
          currencyName: 'Aave Interest Bearing REN',
          denominations: [
            {
              name: 'AREN',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xcc12abe4ff81c9378d670de1b57f8e0dd228d77a'
        },
        {
          currencyCode: 'AUSDT',
          currencyName: 'Aave Interest Bearing USDT',
          denominations: [
            {
              name: 'AUSDT',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811'
        },
        {
          currencyCode: 'AMKR',
          currencyName: 'Aave Interest Bearing MKR',
          denominations: [
            {
              name: 'AMKR',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xc713e5e149d5d0715dcd1c156a020976e7e56b88'
        },
        {
          currencyCode: 'AMANA',
          currencyName: 'Aave Interest Bearing MANA',
          denominations: [
            {
              name: 'AMANA',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xa685a61171bb30d4072b338c80cb7b2c865c873e'
        },
        {
          currencyCode: 'AZRX',
          currencyName: 'Aave Interest Bearing ZRX',
          denominations: [
            {
              name: 'AZRX',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xdf7ff54aacacbff42dfe29dd6144a69b629f8c9e'
        },
        {
          currencyCode: 'AKNC',
          currencyName: 'Aave Interest Bearing KNC',
          denominations: [
            {
              name: 'AKNC',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x39c6b3e42d6a679d7d776778fe880bc9487c2eda'
        },
        {
          currencyCode: 'AUSDC',
          currencyName: 'Aave Interest Bearing USDC',
          denominations: [
            {
              name: 'AUSDC',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0xbcca60bb61934080951369a648fb03df4f96263c'
        },
        {
          currencyCode: 'ASUSD',
          currencyName: 'Aave Interest Bearing SUSD',
          denominations: [
            {
              name: 'ASUSD',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x6c5024cd4f8a59110119c56f8933403a539555eb'
        },
        {
          currencyCode: 'AUNI',
          currencyName: 'Aave Interest Bearing UNI',
          denominations: [
            {
              name: 'AUNI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1'
        },
        {
          currencyCode: 'WBTC',
          currencyName: 'Wrapped Bitcoin',
          denominations: [
            {
              name: 'WBTC',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
        },
        {
          currencyCode: 'YFI',
          currencyName: 'Yearn Finance',
          denominations: [
            {
              name: 'YFI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'
        },
        {
          currencyCode: 'CRV',
          currencyName: 'Curve DAO Token',
          denominations: [
            {
              name: 'CRV',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xD533a949740bb3306d119CC777fa900bA034cd52'
        },
        {
          currencyCode: 'BAL',
          currencyName: 'Balancer',
          denominations: [
            {
              name: 'BAL',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xba100000625a3754423978a60c9317c58a424e3d'
        },
        {
          currencyCode: 'SUSHI',
          currencyName: 'Sushi Token',
          denominations: [
            {
              name: 'SUSHI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
        },
        {
          currencyCode: 'UMA',
          currencyName: 'UMA',
          denominations: [
            {
              name: 'UMA',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828'
        },
        {
          currencyCode: 'BADGER',
          currencyName: 'Badger',
          denominations: [
            {
              name: 'BADGER',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x3472A5A71965499acd81997a54BBA8D852C6E53d'
        },
        {
          currencyCode: 'IDLE',
          currencyName: 'Idle Finance',
          denominations: [
            {
              name: 'IDLE',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x875773784Af8135eA0ef43b5a374AaD105c5D39e'
        },
        {
          currencyCode: 'NXM',
          currencyName: 'Nexus Mutual',
          denominations: [
            {
              name: 'NXM',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xd7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b'
        },
        {
          currencyCode: 'CREAM',
          currencyName: 'Cream',
          denominations: [
            {
              name: 'CREAM',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x2ba592F78dB6436527729929AAf6c908497cB200'
        },
        {
          currencyCode: 'PICKLE',
          currencyName: 'PickleToken',
          denominations: [
            {
              name: 'PICKLE',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5'
        },
        {
          currencyCode: 'CVP',
          currencyName: 'Concentrated Voting Power',
          denominations: [
            {
              name: 'CVP',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1'
        },
        {
          currencyCode: 'ROOK',
          currencyName: 'Keeper DAO',
          denominations: [
            {
              name: 'ROOK',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xfA5047c9c78B8877af97BDcb85Db743fD7313d4a'
        },
        {
          currencyCode: 'DOUGH',
          currencyName: 'PieDAO',
          denominations: [
            {
              name: 'DOUGH',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xad32a8e6220741182940c5abf610bde99e737b2d'
        },
        {
          currencyCode: 'COMBO',
          currencyName: 'COMBO',
          denominations: [
            {
              name: 'COMBO',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xffffffff2ba8f66d4e51811c5190992176930278'
        },
        {
          currencyCode: 'INDEX',
          currencyName: 'INDEX COOP',
          denominations: [
            {
              name: 'INDEX',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x0954906da0Bf32d5479e25f46056d22f08464cab'
        },
        {
          currencyCode: 'WETH',
          currencyName: 'Wrapped ETH',
          denominations: [
            {
              name: 'WETH',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        },
        {
          currencyCode: 'RENBTC',
          currencyName: 'Ren BTC',
          denominations: [
            {
              name: 'RENBTC',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d'
        },
        {
          currencyCode: 'RENBCH',
          currencyName: 'Ren BCH',
          denominations: [
            {
              name: 'RENBCH',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x459086f2376525bdceba5bdda135e4e9d3fef5bf'
        },
        {
          currencyCode: 'RENZEC',
          currencyName: 'Ren ZEC',
          denominations: [
            {
              name: 'RENZEC',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2'
        },
        {
          currencyCode: 'TBTC',
          currencyName: 'tBTC',
          denominations: [
            {
              name: 'TBTC',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa'
        },
        {
          currencyCode: 'DPI',
          currencyName: 'DefiPulse Index',
          denominations: [
            {
              name: 'DPI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b'
        },
        {
          currencyCode: 'YETI',
          currencyName: 'Yearn Ecosystem Token Index',
          denominations: [
            {
              name: 'YETI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xb4bebd34f6daafd808f73de0d10235a92fbb6c3d'
        },
        {
          currencyCode: 'BAND',
          currencyName: 'BAND',
          denominations: [
            {
              name: 'BAND',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55'
        },
        {
          currencyCode: 'REN',
          currencyName: 'Ren',
          denominations: [
            {
              name: 'REN',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x408e41876cccdc0f92210600ef50372656052a38'
        },
        {
          currencyCode: 'AMPL',
          currencyName: 'Ampleforth',
          denominations: [
            {
              name: 'AMPL',
              multiplier: '1000000000'
            }
          ],
          contractAddress: '0xd46ba6d942050d489dbd938a2c909a5d5039a161'
        },
        {
          currencyCode: 'OCEAN',
          currencyName: 'OCEAN',
          denominations: [
            {
              name: 'OCEAN',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
        },
        {
          currencyCode: 'GLM',
          currencyName: 'Golem',
          denominations: [
            {
              name: 'GLM',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429'
        },
        {
          currencyCode: 'UNI',
          currencyName: 'Uniswap',
          denominations: [
            {
              name: 'UNI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
        },
        {
          currencyCode: 'MATIC',
          currencyName: 'Polygon',
          denominations: [
            {
              name: 'MATIC',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
        },
        {
          currencyCode: 'BNB',
          currencyName: 'Binance',
          denominations: [
            {
              name: 'BNB',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
        },
        {
          currencyCode: 'FTM',
          currencyName: 'Fantom',
          denominations: [
            {
              name: 'FTM',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x4e15361fd6b4bb609fa63c81a2be19d873717870'
        },
        {
          currencyCode: '1INCH',
          currencyName: '1inch',
          denominations: [
            {
              name: '1INCH',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x111111111117dc0aa78b770fa6a738034120c302'
        }
      ]
    },
    allTokens: {
      '1985365e9f78359a9b6ad760e32412f4a445e862': {
        currencyCode: 'REP',
        denominations: [
          {
            name: 'REP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Augur',
        networkLocation: {
          contractAddress: '0x1985365e9f78359a9B6AD760e32412f4a445E862'
        }
      },
      '221657776846890989a759ba2973e427dff5c9bb': {
        currencyCode: 'REPV2',
        denominations: [
          {
            name: 'REPV2',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Augur v2',
        networkLocation: {
          contractAddress: '0x221657776846890989a759BA2973e427DfF5C9bB'
        }
      },
      '2e91e3e54c5788e9fdd6a181497fdcea1de1bcc1': {
        currencyCode: 'HERC',
        denominations: [
          {
            name: 'HERC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Hercules',
        networkLocation: {
          contractAddress: '0x2e91E3e54C5788e9FdD6A181497FDcEa1De1bcc1'
        }
      },
      '6b175474e89094c44da98b954eedeac495271d0f': {
        currencyCode: 'DAI',
        denominations: [
          {
            name: 'DAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Dai Stablecoin',
        networkLocation: {
          contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        }
      },
      '89d24a6b4ccb1b6faa2625fe562bdd9a23260359': {
        currencyCode: 'SAI',
        denominations: [
          {
            name: 'SAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Sai Stablecoin',
        networkLocation: {
          contractAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
        }
      },
      '667088b212ce3d06a1b553a7221e1fd19000d9af': {
        currencyCode: 'WINGS',
        denominations: [
          {
            name: 'WINGS',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wings',
        networkLocation: {
          contractAddress: '0x667088b212ce3d06a1b553a7221E1fD19000d9aF'
        }
      },
      dac17f958d2ee523a2206206994597c13d831ec7: {
        currencyCode: 'USDT',
        denominations: [
          {
            name: 'USDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Tether',
        networkLocation: {
          contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
        }
      },
      f8e386eda857484f5a12e4b5daa9984e06e73705: {
        currencyCode: 'IND',
        denominations: [
          {
            name: 'IND',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Indorse',
        networkLocation: {
          contractAddress: '0xf8e386EDa857484f5a12e4B5DAa9984E06E73705'
        }
      },
      cdb7ecfd3403eef3882c65b761ef9b5054890a47: {
        currencyCode: 'HUR',
        denominations: [
          {
            name: 'HUR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Hurify',
        networkLocation: {
          contractAddress: '0xCDB7eCFd3403Eef3882c65B761ef9B5054890a47'
        }
      },
      '960b236a07cf122663c4303350609a66a7b288c0': {
        currencyCode: 'ANTV1',
        denominations: [
          {
            name: 'ANTV1',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aragon',
        networkLocation: {
          contractAddress: '0x960b236A07cf122663c4303350609A66A7B288C0'
        }
      },
      a117000000f279d81a1d3cc75430faa017fa5a2e: {
        currencyCode: 'ANT',
        denominations: [
          {
            name: 'ANT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aragon',
        networkLocation: {
          contractAddress: '0xa117000000f279D81A1D3cc75430fAA017FA5A2e'
        }
      },
      '0d8775f648430679a709e98d2b0cb6250d2887ef': {
        currencyCode: 'BAT',
        denominations: [
          {
            name: 'BAT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Basic Attention Token',
        networkLocation: {
          contractAddress: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF'
        }
      },
      '1f573d6fb3f13d689ff844b4ce37794d79a7ff1c': {
        currencyCode: 'BNT',
        denominations: [
          {
            name: 'BNT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Bancor',
        networkLocation: {
          contractAddress: '0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C'
        }
      },
      a74476443119a942de498590fe1f2454d7d4ac0d: {
        currencyCode: 'GNT',
        denominations: [
          {
            name: 'GNT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Golem (old)',
        networkLocation: {
          contractAddress: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d'
        }
      },
      dd974d5c2e2928dea5f71b9825b8b646686bd200: {
        currencyCode: 'KNC',
        denominations: [
          {
            name: 'KNC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Kyber Network',
        networkLocation: {
          contractAddress: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200'
        }
      },
      '9992ec3cf6a55b00978cddf2b27bc6882d88d1ec': {
        currencyCode: 'POLY',
        denominations: [
          {
            name: 'POLY',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Polymath Network',
        networkLocation: {
          contractAddress: '0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC'
        }
      },
      b64ef51c888972c908cfacf59b47c1afbc0ab8ac: {
        currencyCode: 'STORJ',
        denominations: [
          {
            name: 'STORJ',
            multiplier: '100000000'
          }
        ],
        displayName: 'Storj',
        networkLocation: {
          contractAddress: '0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC'
        }
      },
      a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48: {
        currencyCode: 'USDC',
        denominations: [
          {
            name: 'USDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        }
      },
      a4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe: {
        currencyCode: 'USDS',
        denominations: [
          {
            name: 'USDS',
            multiplier: '1000000'
          }
        ],
        displayName: 'StableUSD',
        networkLocation: {
          contractAddress: '0xA4Bdb11dc0a2bEC88d24A3aa1E6Bb17201112eBe'
        }
      },
      '0000000000085d4780b73119b644ae5ecd22b376': {
        currencyCode: 'TUSD',
        denominations: [
          {
            name: 'TUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'TrueUSD',
        networkLocation: {
          contractAddress: '0x0000000000085d4780B73119b644AE5ecd22b376'
        }
      },
      e41d2489571d322189246dafa5ebde1f4699f498: {
        currencyCode: 'ZRX',
        denominations: [
          {
            name: 'ZRX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: '0x',
        networkLocation: {
          contractAddress: '0xE41d2489571d322189246DaFA5ebDe1F4699F498'
        }
      },
      '6810e776880c02933d47db1b9fc05908e5386b96': {
        currencyCode: 'GNO',
        denominations: [
          {
            name: 'GNO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Gnosis',
        networkLocation: {
          contractAddress: '0x6810e776880C02933D47DB1b9fc05908e5386b96'
        }
      },
      d26114cd6ee289accf82350c8d8487fedb8a0c07: {
        currencyCode: 'OMG',
        denominations: [
          {
            name: 'OMG',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'OmiseGO',
        networkLocation: {
          contractAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
        }
      },
      '1776e1f26f98b1a5df9cd347953a26dd3cb46671': {
        currencyCode: 'NMR',
        denominations: [
          {
            name: 'NMR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Numeraire',
        networkLocation: {
          contractAddress: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671'
        }
      },
      '9f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
        currencyCode: 'MKR',
        denominations: [
          {
            name: 'MKR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Maker',
        networkLocation: {
          contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'
        }
      },
      '056fd409e1d7a124bd7017459dfea2f387b6d5cd': {
        currencyCode: 'GUSD',
        denominations: [
          {
            name: 'GUSD',
            multiplier: '100'
          }
        ],
        displayName: 'Gemini Dollar',
        networkLocation: {
          contractAddress: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd'
        }
      },
      '8e870d67f660d95d5be530380d0ec0bd388289e1': {
        currencyCode: 'USDP',
        denominations: [
          {
            name: 'USDP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Pax Dollar',
        networkLocation: {
          contractAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1'
        }
      },
      '4156d3342d5c385a87d264f90653733592000581': {
        currencyCode: 'SALT',
        denominations: [
          {
            name: 'SALT',
            multiplier: '100000000'
          }
        ],
        displayName: 'SALT',
        networkLocation: {
          contractAddress: '0x4156D3342D5c385a87D264F90653733592000581'
        }
      },
      '0f5d2fb29fb7d3cfee444a200298f468908cc942': {
        currencyCode: 'MANA',
        denominations: [
          {
            name: 'MANA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Decentraland',
        networkLocation: {
          contractAddress: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942'
        }
      },
      b62132e35a6c13ee1ee0f84dc5d40bad8d815206: {
        currencyCode: 'NEXO',
        denominations: [
          {
            name: 'NEXO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Nexo',
        networkLocation: {
          contractAddress: '0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206'
        }
      },
      '419d0d8bdd9af5e606ae2232ed285aff190e711b': {
        currencyCode: 'FUN',
        denominations: [
          {
            name: 'FUN',
            multiplier: '100000000'
          }
        ],
        displayName: 'FunFair',
        networkLocation: {
          contractAddress: '0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b'
        }
      },
      '818fc6c2ec5986bc6e2cbf00939d90556ab12ce5': {
        currencyCode: 'KIN',
        denominations: [
          {
            name: 'KIN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Kin',
        networkLocation: {
          contractAddress: '0x818Fc6C2Ec5986bc6E2CBf00939d90556aB12ce5'
        }
      },
      '514910771af9ca656af840dff83e8264ecf986ca': {
        currencyCode: 'LINK',
        denominations: [
          {
            name: 'LINK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Chainlink',
        networkLocation: {
          contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca'
        }
      },
      '420412e765bfa6d85aaac94b4f7b708c89be2e2b': {
        currencyCode: 'BRZ',
        denominations: [
          {
            name: 'BRZ',
            multiplier: '10000'
          }
        ],
        displayName: 'BRZ Token',
        networkLocation: {
          contractAddress: '0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B'
        }
      },
      '158079ee67fce2f58472a96584a73c7ab9ac95c1': {
        currencyCode: 'CREP',
        denominations: [
          {
            name: 'CREP',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound Augur',
        networkLocation: {
          contractAddress: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1'
        }
      },
      '39aa39c021dfbae8fac545936693ac917d5e7563': {
        currencyCode: 'CUSDC',
        denominations: [
          {
            name: 'CUSDC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound USDC',
        networkLocation: {
          contractAddress: '0x39aa39c021dfbae8fac545936693ac917d5e7563'
        }
      },
      '4ddc2d193948926d02f9b1fe9e1daa0718270ed5': {
        currencyCode: 'CETH',
        denominations: [
          {
            name: 'CETH',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound ETH',
        networkLocation: {
          contractAddress: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'
        }
      },
      '6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e': {
        currencyCode: 'CBAT',
        denominations: [
          {
            name: 'CBAT',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound BAT',
        networkLocation: {
          contractAddress: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'
        }
      },
      b3319f5d18bc0d84dd1b4825dcde5d5f7266d407: {
        currencyCode: 'CZRX',
        denominations: [
          {
            name: 'CZRX',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound ZRX',
        networkLocation: {
          contractAddress: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407'
        }
      },
      c11b1268c1a384e55c48c2391d8d480264a3a7f4: {
        currencyCode: 'CWBTC',
        denominations: [
          {
            name: 'CWBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound WBTC',
        networkLocation: {
          contractAddress: '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4'
        }
      },
      f5dce57282a584d2746faf1593d3121fcac444dc: {
        currencyCode: 'CSAI',
        denominations: [
          {
            name: 'CSAI',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound SAI',
        networkLocation: {
          contractAddress: '0xf5dce57282a584d2746faf1593d3121fcac444dc'
        }
      },
      '5d3a536e4d6dbd6114cc1ead35777bab948e3643': {
        currencyCode: 'CDAI',
        denominations: [
          {
            name: 'CDAI',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound DAI',
        networkLocation: {
          contractAddress: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        }
      },
      b1cd6e4153b2a390cf00a6556b0fc1458c4a5533: {
        currencyCode: 'ETHBNT',
        denominations: [
          {
            name: 'ETHBNT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'BNT Smart Token Relay',
        networkLocation: {
          contractAddress: '0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533'
        }
      },
      '4575f41308ec1483f3d399aa9a2826d74da13deb': {
        currencyCode: 'OXT',
        denominations: [
          {
            name: 'OXT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Orchid',
        networkLocation: {
          contractAddress: '0x4575f41308EC1483f3d399aa9a2826d74Da13Deb'
        }
      },
      c00e94cb662c3520282e6f5717214004a7f26888: {
        currencyCode: 'COMP',
        denominations: [
          {
            name: 'COMP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Compound',
        networkLocation: {
          contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888'
        }
      },
      a3d58c4e56fedcae3a7c43a725aee9a71f0ece4e: {
        currencyCode: 'MET',
        denominations: [
          {
            name: 'MET',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Metronome',
        networkLocation: {
          contractAddress: '0xa3d58c4e56fedcae3a7c43a725aee9a71f0ece4e'
        }
      },
      c011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f: {
        currencyCode: 'SNX',
        denominations: [
          {
            name: 'SNX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Synthetix Network',
        networkLocation: {
          contractAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
        }
      },
      '57ab1ec28d129707052df4df418d58a2d46d5f51': {
        currencyCode: 'SUSD',
        denominations: [
          {
            name: 'SUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Synthetix USD',
        networkLocation: {
          contractAddress: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'
        }
      },
      fe18be6b3bd88a2d2a7f928d00292e7a9963cfc6: {
        currencyCode: 'SBTC',
        denominations: [
          {
            name: 'SBTC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Synthetix BTC',
        networkLocation: {
          contractAddress: '0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6'
        }
      },
      '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': {
        currencyCode: 'AAVE',
        denominations: [
          {
            name: 'AAVE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave',
        networkLocation: {
          contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
        }
      },
      '5165d24277cd063f5ac44efd447b27025e888f37': {
        currencyCode: 'AYFI',
        denominations: [
          {
            name: 'AYFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing YFI',
        networkLocation: {
          contractAddress: '0x5165d24277cd063f5ac44efd447b27025e888f37'
        }
      },
      a06bc25b5805d5f8d82847d191cb4af5a3e873e0: {
        currencyCode: 'ALINK',
        denominations: [
          {
            name: 'ALINK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing LINK',
        networkLocation: {
          contractAddress: '0xa06bc25b5805d5f8d82847d191cb4af5a3e873e0'
        }
      },
      '028171bca77440897b824ca71d1c56cac55b68a3': {
        currencyCode: 'ADAI',
        denominations: [
          {
            name: 'ADAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing Dai',
        networkLocation: {
          contractAddress: '0x028171bCA77440897B824Ca71D1c56caC55b68A3'
        }
      },
      '05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1': {
        currencyCode: 'ABAT',
        denominations: [
          {
            name: 'ABAT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing BAT',
        networkLocation: {
          contractAddress: '0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1'
        }
      },
      '030ba81f1c18d280636f32af80b9aad02cf0854e': {
        currencyCode: 'AWETH',
        denominations: [
          {
            name: 'AWETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing Wrapped ETH',
        networkLocation: {
          contractAddress: '0x030ba81f1c18d280636f32af80b9aad02cf0854e'
        }
      },
      '9ff58f4ffb29fa2266ab25e75e2a8b3503311656': {
        currencyCode: 'AWBTC',
        denominations: [
          {
            name: 'AWBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Aave Interest Bearing Wrapped BTC',
        networkLocation: {
          contractAddress: '0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656'
        }
      },
      '35f6b052c598d933d69a4eec4d04c73a191fe6c2': {
        currencyCode: 'ASNX',
        denominations: [
          {
            name: 'ASNX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing SNX',
        networkLocation: {
          contractAddress: '0x35f6b052c598d933d69a4eec4d04c73a191fe6c2'
        }
      },
      cc12abe4ff81c9378d670de1b57f8e0dd228d77a: {
        currencyCode: 'AREN',
        denominations: [
          {
            name: 'AREN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing REN',
        networkLocation: {
          contractAddress: '0xcc12abe4ff81c9378d670de1b57f8e0dd228d77a'
        }
      },
      '3ed3b47dd13ec9a98b44e6204a523e766b225811': {
        currencyCode: 'AUSDT',
        denominations: [
          {
            name: 'AUSDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Aave Interest Bearing USDT',
        networkLocation: {
          contractAddress: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811'
        }
      },
      c713e5e149d5d0715dcd1c156a020976e7e56b88: {
        currencyCode: 'AMKR',
        denominations: [
          {
            name: 'AMKR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing MKR',
        networkLocation: {
          contractAddress: '0xc713e5e149d5d0715dcd1c156a020976e7e56b88'
        }
      },
      a685a61171bb30d4072b338c80cb7b2c865c873e: {
        currencyCode: 'AMANA',
        denominations: [
          {
            name: 'AMANA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing MANA',
        networkLocation: {
          contractAddress: '0xa685a61171bb30d4072b338c80cb7b2c865c873e'
        }
      },
      df7ff54aacacbff42dfe29dd6144a69b629f8c9e: {
        currencyCode: 'AZRX',
        denominations: [
          {
            name: 'AZRX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing ZRX',
        networkLocation: {
          contractAddress: '0xdf7ff54aacacbff42dfe29dd6144a69b629f8c9e'
        }
      },
      '39c6b3e42d6a679d7d776778fe880bc9487c2eda': {
        currencyCode: 'AKNC',
        denominations: [
          {
            name: 'AKNC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing KNC',
        networkLocation: {
          contractAddress: '0x39c6b3e42d6a679d7d776778fe880bc9487c2eda'
        }
      },
      bcca60bb61934080951369a648fb03df4f96263c: {
        currencyCode: 'AUSDC',
        denominations: [
          {
            name: 'AUSDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'Aave Interest Bearing USDC',
        networkLocation: {
          contractAddress: '0xbcca60bb61934080951369a648fb03df4f96263c'
        }
      },
      '6c5024cd4f8a59110119c56f8933403a539555eb': {
        currencyCode: 'ASUSD',
        denominations: [
          {
            name: 'ASUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing SUSD',
        networkLocation: {
          contractAddress: '0x6c5024cd4f8a59110119c56f8933403a539555eb'
        }
      },
      b9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1: {
        currencyCode: 'AUNI',
        denominations: [
          {
            name: 'AUNI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing UNI',
        networkLocation: {
          contractAddress: '0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1'
        }
      },
      '2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        currencyCode: 'WBTC',
        denominations: [
          {
            name: 'WBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Wrapped Bitcoin',
        networkLocation: {
          contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
        }
      },
      '0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
        currencyCode: 'YFI',
        denominations: [
          {
            name: 'YFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yearn Finance',
        networkLocation: {
          contractAddress: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'
        }
      },
      d533a949740bb3306d119cc777fa900ba034cd52: {
        currencyCode: 'CRV',
        denominations: [
          {
            name: 'CRV',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Curve DAO Token',
        networkLocation: {
          contractAddress: '0xD533a949740bb3306d119CC777fa900bA034cd52'
        }
      },
      ba100000625a3754423978a60c9317c58a424e3d: {
        currencyCode: 'BAL',
        denominations: [
          {
            name: 'BAL',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Balancer',
        networkLocation: {
          contractAddress: '0xba100000625a3754423978a60c9317c58a424e3d'
        }
      },
      '6b3595068778dd592e39a122f4f5a5cf09c90fe2': {
        currencyCode: 'SUSHI',
        denominations: [
          {
            name: 'SUSHI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Sushi Token',
        networkLocation: {
          contractAddress: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
        }
      },
      '04fa0d235c4abf4bcf4787af4cf447de572ef828': {
        currencyCode: 'UMA',
        denominations: [
          {
            name: 'UMA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'UMA',
        networkLocation: {
          contractAddress: '0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828'
        }
      },
      '3472a5a71965499acd81997a54bba8d852c6e53d': {
        currencyCode: 'BADGER',
        denominations: [
          {
            name: 'BADGER',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Badger',
        networkLocation: {
          contractAddress: '0x3472A5A71965499acd81997a54BBA8D852C6E53d'
        }
      },
      '875773784af8135ea0ef43b5a374aad105c5d39e': {
        currencyCode: 'IDLE',
        denominations: [
          {
            name: 'IDLE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Idle Finance',
        networkLocation: {
          contractAddress: '0x875773784Af8135eA0ef43b5a374AaD105c5D39e'
        }
      },
      d7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b: {
        currencyCode: 'NXM',
        denominations: [
          {
            name: 'NXM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Nexus Mutual',
        networkLocation: {
          contractAddress: '0xd7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b'
        }
      },
      '2ba592f78db6436527729929aaf6c908497cb200': {
        currencyCode: 'CREAM',
        denominations: [
          {
            name: 'CREAM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Cream',
        networkLocation: {
          contractAddress: '0x2ba592F78dB6436527729929AAf6c908497cB200'
        }
      },
      '429881672b9ae42b8eba0e26cd9c73711b891ca5': {
        currencyCode: 'PICKLE',
        denominations: [
          {
            name: 'PICKLE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'PickleToken',
        networkLocation: {
          contractAddress: '0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5'
        }
      },
      '38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1': {
        currencyCode: 'CVP',
        denominations: [
          {
            name: 'CVP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Concentrated Voting Power',
        networkLocation: {
          contractAddress: '0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1'
        }
      },
      fa5047c9c78b8877af97bdcb85db743fd7313d4a: {
        currencyCode: 'ROOK',
        denominations: [
          {
            name: 'ROOK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Keeper DAO',
        networkLocation: {
          contractAddress: '0xfA5047c9c78B8877af97BDcb85Db743fD7313d4a'
        }
      },
      ad32a8e6220741182940c5abf610bde99e737b2d: {
        currencyCode: 'DOUGH',
        denominations: [
          {
            name: 'DOUGH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'PieDAO',
        networkLocation: {
          contractAddress: '0xad32a8e6220741182940c5abf610bde99e737b2d'
        }
      },
      ffffffff2ba8f66d4e51811c5190992176930278: {
        currencyCode: 'COMBO',
        denominations: [
          {
            name: 'COMBO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'COMBO',
        networkLocation: {
          contractAddress: '0xffffffff2ba8f66d4e51811c5190992176930278'
        }
      },
      '0954906da0bf32d5479e25f46056d22f08464cab': {
        currencyCode: 'INDEX',
        denominations: [
          {
            name: 'INDEX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'INDEX COOP',
        networkLocation: {
          contractAddress: '0x0954906da0Bf32d5479e25f46056d22f08464cab'
        }
      },
      c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2: {
        currencyCode: 'WETH',
        denominations: [
          {
            name: 'WETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wrapped ETH',
        networkLocation: {
          contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        }
      },
      eb4c2781e4eba804ce9a9803c67d0893436bb27d: {
        currencyCode: 'RENBTC',
        denominations: [
          {
            name: 'RENBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Ren BTC',
        networkLocation: {
          contractAddress: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d'
        }
      },
      '459086f2376525bdceba5bdda135e4e9d3fef5bf': {
        currencyCode: 'RENBCH',
        denominations: [
          {
            name: 'RENBCH',
            multiplier: '100000000'
          }
        ],
        displayName: 'Ren BCH',
        networkLocation: {
          contractAddress: '0x459086f2376525bdceba5bdda135e4e9d3fef5bf'
        }
      },
      '1c5db575e2ff833e46a2e9864c22f4b22e0b37c2': {
        currencyCode: 'RENZEC',
        denominations: [
          {
            name: 'RENZEC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Ren ZEC',
        networkLocation: {
          contractAddress: '0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2'
        }
      },
      '8daebade922df735c38c80c7ebd708af50815faa': {
        currencyCode: 'TBTC',
        denominations: [
          {
            name: 'TBTC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'tBTC',
        networkLocation: {
          contractAddress: '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa'
        }
      },
      '1494ca1f11d487c2bbe4543e90080aeba4ba3c2b': {
        currencyCode: 'DPI',
        denominations: [
          {
            name: 'DPI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'DefiPulse Index',
        networkLocation: {
          contractAddress: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b'
        }
      },
      b4bebd34f6daafd808f73de0d10235a92fbb6c3d: {
        currencyCode: 'YETI',
        denominations: [
          {
            name: 'YETI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yearn Ecosystem Token Index',
        networkLocation: {
          contractAddress: '0xb4bebd34f6daafd808f73de0d10235a92fbb6c3d'
        }
      },
      ba11d00c5f74255f56a5e366f4f77f5a186d7f55: {
        currencyCode: 'BAND',
        denominations: [
          {
            name: 'BAND',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'BAND',
        networkLocation: {
          contractAddress: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55'
        }
      },
      '408e41876cccdc0f92210600ef50372656052a38': {
        currencyCode: 'REN',
        denominations: [
          {
            name: 'REN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Ren',
        networkLocation: {
          contractAddress: '0x408e41876cccdc0f92210600ef50372656052a38'
        }
      },
      d46ba6d942050d489dbd938a2c909a5d5039a161: {
        currencyCode: 'AMPL',
        denominations: [
          {
            name: 'AMPL',
            multiplier: '1000000000'
          }
        ],
        displayName: 'Ampleforth',
        networkLocation: {
          contractAddress: '0xd46ba6d942050d489dbd938a2c909a5d5039a161'
        }
      },
      '967da4048cd07ab37855c090aaf366e4ce1b9f48': {
        currencyCode: 'OCEAN',
        denominations: [
          {
            name: 'OCEAN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'OCEAN',
        networkLocation: {
          contractAddress: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
        }
      },
      '7dd9c5cba05e151c895fde1cf355c9a1d5da6429': {
        currencyCode: 'GLM',
        denominations: [
          {
            name: 'GLM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Golem',
        networkLocation: {
          contractAddress: '0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429'
        }
      },
      '1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        currencyCode: 'UNI',
        denominations: [
          {
            name: 'UNI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Uniswap',
        networkLocation: {
          contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
        }
      },
      '7d1afa7b718fb893db30a3abc0cfc608aacfebb0': {
        currencyCode: 'MATIC',
        denominations: [
          {
            name: 'MATIC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Polygon',
        networkLocation: {
          contractAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
        }
      },
      b8c77482e45f1f44de1745f52c74426c631bdd52: {
        currencyCode: 'BNB',
        denominations: [
          {
            name: 'BNB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance',
        networkLocation: {
          contractAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
        }
      },
      '4e15361fd6b4bb609fa63c81a2be19d873717870': {
        currencyCode: 'FTM',
        denominations: [
          {
            name: 'FTM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Fantom',
        networkLocation: {
          contractAddress: '0x4e15361fd6b4bb609fa63c81a2be19d873717870'
        }
      },
      '111111111117dc0aa78b770fa6a738034120c302': {
        currencyCode: '1INCH',
        denominations: [
          {
            name: '1INCH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: '1inch',
        networkLocation: {
          contractAddress: '0x111111111117dc0aa78b770fa6a738034120c302'
        }
      }
    },
    builtinTokens: {
      '1985365e9f78359a9b6ad760e32412f4a445e862': {
        currencyCode: 'REP',
        denominations: [
          {
            name: 'REP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Augur',
        networkLocation: {
          contractAddress: '0x1985365e9f78359a9B6AD760e32412f4a445E862'
        }
      },
      '221657776846890989a759ba2973e427dff5c9bb': {
        currencyCode: 'REPV2',
        denominations: [
          {
            name: 'REPV2',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Augur v2',
        networkLocation: {
          contractAddress: '0x221657776846890989a759BA2973e427DfF5C9bB'
        }
      },
      '2e91e3e54c5788e9fdd6a181497fdcea1de1bcc1': {
        currencyCode: 'HERC',
        denominations: [
          {
            name: 'HERC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Hercules',
        networkLocation: {
          contractAddress: '0x2e91E3e54C5788e9FdD6A181497FDcEa1De1bcc1'
        }
      },
      '6b175474e89094c44da98b954eedeac495271d0f': {
        currencyCode: 'DAI',
        denominations: [
          {
            name: 'DAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Dai Stablecoin',
        networkLocation: {
          contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        }
      },
      '89d24a6b4ccb1b6faa2625fe562bdd9a23260359': {
        currencyCode: 'SAI',
        denominations: [
          {
            name: 'SAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Sai Stablecoin',
        networkLocation: {
          contractAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
        }
      },
      '667088b212ce3d06a1b553a7221e1fd19000d9af': {
        currencyCode: 'WINGS',
        denominations: [
          {
            name: 'WINGS',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wings',
        networkLocation: {
          contractAddress: '0x667088b212ce3d06a1b553a7221E1fD19000d9aF'
        }
      },
      dac17f958d2ee523a2206206994597c13d831ec7: {
        currencyCode: 'USDT',
        denominations: [
          {
            name: 'USDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Tether',
        networkLocation: {
          contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
        }
      },
      f8e386eda857484f5a12e4b5daa9984e06e73705: {
        currencyCode: 'IND',
        denominations: [
          {
            name: 'IND',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Indorse',
        networkLocation: {
          contractAddress: '0xf8e386EDa857484f5a12e4B5DAa9984E06E73705'
        }
      },
      cdb7ecfd3403eef3882c65b761ef9b5054890a47: {
        currencyCode: 'HUR',
        denominations: [
          {
            name: 'HUR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Hurify',
        networkLocation: {
          contractAddress: '0xCDB7eCFd3403Eef3882c65B761ef9B5054890a47'
        }
      },
      '960b236a07cf122663c4303350609a66a7b288c0': {
        currencyCode: 'ANTV1',
        denominations: [
          {
            name: 'ANTV1',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aragon',
        networkLocation: {
          contractAddress: '0x960b236A07cf122663c4303350609A66A7B288C0'
        }
      },
      a117000000f279d81a1d3cc75430faa017fa5a2e: {
        currencyCode: 'ANT',
        denominations: [
          {
            name: 'ANT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aragon',
        networkLocation: {
          contractAddress: '0xa117000000f279D81A1D3cc75430fAA017FA5A2e'
        }
      },
      '0d8775f648430679a709e98d2b0cb6250d2887ef': {
        currencyCode: 'BAT',
        denominations: [
          {
            name: 'BAT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Basic Attention Token',
        networkLocation: {
          contractAddress: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF'
        }
      },
      '1f573d6fb3f13d689ff844b4ce37794d79a7ff1c': {
        currencyCode: 'BNT',
        denominations: [
          {
            name: 'BNT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Bancor',
        networkLocation: {
          contractAddress: '0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C'
        }
      },
      a74476443119a942de498590fe1f2454d7d4ac0d: {
        currencyCode: 'GNT',
        denominations: [
          {
            name: 'GNT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Golem (old)',
        networkLocation: {
          contractAddress: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d'
        }
      },
      dd974d5c2e2928dea5f71b9825b8b646686bd200: {
        currencyCode: 'KNC',
        denominations: [
          {
            name: 'KNC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Kyber Network',
        networkLocation: {
          contractAddress: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200'
        }
      },
      '9992ec3cf6a55b00978cddf2b27bc6882d88d1ec': {
        currencyCode: 'POLY',
        denominations: [
          {
            name: 'POLY',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Polymath Network',
        networkLocation: {
          contractAddress: '0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC'
        }
      },
      b64ef51c888972c908cfacf59b47c1afbc0ab8ac: {
        currencyCode: 'STORJ',
        denominations: [
          {
            name: 'STORJ',
            multiplier: '100000000'
          }
        ],
        displayName: 'Storj',
        networkLocation: {
          contractAddress: '0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC'
        }
      },
      a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48: {
        currencyCode: 'USDC',
        denominations: [
          {
            name: 'USDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        }
      },
      a4bdb11dc0a2bec88d24a3aa1e6bb17201112ebe: {
        currencyCode: 'USDS',
        denominations: [
          {
            name: 'USDS',
            multiplier: '1000000'
          }
        ],
        displayName: 'StableUSD',
        networkLocation: {
          contractAddress: '0xA4Bdb11dc0a2bEC88d24A3aa1E6Bb17201112eBe'
        }
      },
      '0000000000085d4780b73119b644ae5ecd22b376': {
        currencyCode: 'TUSD',
        denominations: [
          {
            name: 'TUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'TrueUSD',
        networkLocation: {
          contractAddress: '0x0000000000085d4780B73119b644AE5ecd22b376'
        }
      },
      e41d2489571d322189246dafa5ebde1f4699f498: {
        currencyCode: 'ZRX',
        denominations: [
          {
            name: 'ZRX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: '0x',
        networkLocation: {
          contractAddress: '0xE41d2489571d322189246DaFA5ebDe1F4699F498'
        }
      },
      '6810e776880c02933d47db1b9fc05908e5386b96': {
        currencyCode: 'GNO',
        denominations: [
          {
            name: 'GNO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Gnosis',
        networkLocation: {
          contractAddress: '0x6810e776880C02933D47DB1b9fc05908e5386b96'
        }
      },
      d26114cd6ee289accf82350c8d8487fedb8a0c07: {
        currencyCode: 'OMG',
        denominations: [
          {
            name: 'OMG',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'OmiseGO',
        networkLocation: {
          contractAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
        }
      },
      '1776e1f26f98b1a5df9cd347953a26dd3cb46671': {
        currencyCode: 'NMR',
        denominations: [
          {
            name: 'NMR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Numeraire',
        networkLocation: {
          contractAddress: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671'
        }
      },
      '9f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
        currencyCode: 'MKR',
        denominations: [
          {
            name: 'MKR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Maker',
        networkLocation: {
          contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'
        }
      },
      '056fd409e1d7a124bd7017459dfea2f387b6d5cd': {
        currencyCode: 'GUSD',
        denominations: [
          {
            name: 'GUSD',
            multiplier: '100'
          }
        ],
        displayName: 'Gemini Dollar',
        networkLocation: {
          contractAddress: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd'
        }
      },
      '8e870d67f660d95d5be530380d0ec0bd388289e1': {
        currencyCode: 'USDP',
        denominations: [
          {
            name: 'USDP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Pax Dollar',
        networkLocation: {
          contractAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1'
        }
      },
      '4156d3342d5c385a87d264f90653733592000581': {
        currencyCode: 'SALT',
        denominations: [
          {
            name: 'SALT',
            multiplier: '100000000'
          }
        ],
        displayName: 'SALT',
        networkLocation: {
          contractAddress: '0x4156D3342D5c385a87D264F90653733592000581'
        }
      },
      '0f5d2fb29fb7d3cfee444a200298f468908cc942': {
        currencyCode: 'MANA',
        denominations: [
          {
            name: 'MANA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Decentraland',
        networkLocation: {
          contractAddress: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942'
        }
      },
      b62132e35a6c13ee1ee0f84dc5d40bad8d815206: {
        currencyCode: 'NEXO',
        denominations: [
          {
            name: 'NEXO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Nexo',
        networkLocation: {
          contractAddress: '0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206'
        }
      },
      '419d0d8bdd9af5e606ae2232ed285aff190e711b': {
        currencyCode: 'FUN',
        denominations: [
          {
            name: 'FUN',
            multiplier: '100000000'
          }
        ],
        displayName: 'FunFair',
        networkLocation: {
          contractAddress: '0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b'
        }
      },
      '818fc6c2ec5986bc6e2cbf00939d90556ab12ce5': {
        currencyCode: 'KIN',
        denominations: [
          {
            name: 'KIN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Kin',
        networkLocation: {
          contractAddress: '0x818Fc6C2Ec5986bc6E2CBf00939d90556aB12ce5'
        }
      },
      '514910771af9ca656af840dff83e8264ecf986ca': {
        currencyCode: 'LINK',
        denominations: [
          {
            name: 'LINK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Chainlink',
        networkLocation: {
          contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca'
        }
      },
      '420412e765bfa6d85aaac94b4f7b708c89be2e2b': {
        currencyCode: 'BRZ',
        denominations: [
          {
            name: 'BRZ',
            multiplier: '10000'
          }
        ],
        displayName: 'BRZ Token',
        networkLocation: {
          contractAddress: '0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B'
        }
      },
      '158079ee67fce2f58472a96584a73c7ab9ac95c1': {
        currencyCode: 'CREP',
        denominations: [
          {
            name: 'CREP',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound Augur',
        networkLocation: {
          contractAddress: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1'
        }
      },
      '39aa39c021dfbae8fac545936693ac917d5e7563': {
        currencyCode: 'CUSDC',
        denominations: [
          {
            name: 'CUSDC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound USDC',
        networkLocation: {
          contractAddress: '0x39aa39c021dfbae8fac545936693ac917d5e7563'
        }
      },
      '4ddc2d193948926d02f9b1fe9e1daa0718270ed5': {
        currencyCode: 'CETH',
        denominations: [
          {
            name: 'CETH',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound ETH',
        networkLocation: {
          contractAddress: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'
        }
      },
      '6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e': {
        currencyCode: 'CBAT',
        denominations: [
          {
            name: 'CBAT',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound BAT',
        networkLocation: {
          contractAddress: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'
        }
      },
      b3319f5d18bc0d84dd1b4825dcde5d5f7266d407: {
        currencyCode: 'CZRX',
        denominations: [
          {
            name: 'CZRX',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound ZRX',
        networkLocation: {
          contractAddress: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407'
        }
      },
      c11b1268c1a384e55c48c2391d8d480264a3a7f4: {
        currencyCode: 'CWBTC',
        denominations: [
          {
            name: 'CWBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound WBTC',
        networkLocation: {
          contractAddress: '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4'
        }
      },
      f5dce57282a584d2746faf1593d3121fcac444dc: {
        currencyCode: 'CSAI',
        denominations: [
          {
            name: 'CSAI',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound SAI',
        networkLocation: {
          contractAddress: '0xf5dce57282a584d2746faf1593d3121fcac444dc'
        }
      },
      '5d3a536e4d6dbd6114cc1ead35777bab948e3643': {
        currencyCode: 'CDAI',
        denominations: [
          {
            name: 'CDAI',
            multiplier: '100000000'
          }
        ],
        displayName: 'Compound DAI',
        networkLocation: {
          contractAddress: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        }
      },
      b1cd6e4153b2a390cf00a6556b0fc1458c4a5533: {
        currencyCode: 'ETHBNT',
        denominations: [
          {
            name: 'ETHBNT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'BNT Smart Token Relay',
        networkLocation: {
          contractAddress: '0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533'
        }
      },
      '4575f41308ec1483f3d399aa9a2826d74da13deb': {
        currencyCode: 'OXT',
        denominations: [
          {
            name: 'OXT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Orchid',
        networkLocation: {
          contractAddress: '0x4575f41308EC1483f3d399aa9a2826d74Da13Deb'
        }
      },
      c00e94cb662c3520282e6f5717214004a7f26888: {
        currencyCode: 'COMP',
        denominations: [
          {
            name: 'COMP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Compound',
        networkLocation: {
          contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888'
        }
      },
      a3d58c4e56fedcae3a7c43a725aee9a71f0ece4e: {
        currencyCode: 'MET',
        denominations: [
          {
            name: 'MET',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Metronome',
        networkLocation: {
          contractAddress: '0xa3d58c4e56fedcae3a7c43a725aee9a71f0ece4e'
        }
      },
      c011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f: {
        currencyCode: 'SNX',
        denominations: [
          {
            name: 'SNX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Synthetix Network',
        networkLocation: {
          contractAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
        }
      },
      '57ab1ec28d129707052df4df418d58a2d46d5f51': {
        currencyCode: 'SUSD',
        denominations: [
          {
            name: 'SUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Synthetix USD',
        networkLocation: {
          contractAddress: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51'
        }
      },
      fe18be6b3bd88a2d2a7f928d00292e7a9963cfc6: {
        currencyCode: 'SBTC',
        denominations: [
          {
            name: 'SBTC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Synthetix BTC',
        networkLocation: {
          contractAddress: '0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6'
        }
      },
      '7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': {
        currencyCode: 'AAVE',
        denominations: [
          {
            name: 'AAVE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave',
        networkLocation: {
          contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
        }
      },
      '5165d24277cd063f5ac44efd447b27025e888f37': {
        currencyCode: 'AYFI',
        denominations: [
          {
            name: 'AYFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing YFI',
        networkLocation: {
          contractAddress: '0x5165d24277cd063f5ac44efd447b27025e888f37'
        }
      },
      a06bc25b5805d5f8d82847d191cb4af5a3e873e0: {
        currencyCode: 'ALINK',
        denominations: [
          {
            name: 'ALINK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing LINK',
        networkLocation: {
          contractAddress: '0xa06bc25b5805d5f8d82847d191cb4af5a3e873e0'
        }
      },
      '028171bca77440897b824ca71d1c56cac55b68a3': {
        currencyCode: 'ADAI',
        denominations: [
          {
            name: 'ADAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing Dai',
        networkLocation: {
          contractAddress: '0x028171bCA77440897B824Ca71D1c56caC55b68A3'
        }
      },
      '05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1': {
        currencyCode: 'ABAT',
        denominations: [
          {
            name: 'ABAT',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing BAT',
        networkLocation: {
          contractAddress: '0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1'
        }
      },
      '030ba81f1c18d280636f32af80b9aad02cf0854e': {
        currencyCode: 'AWETH',
        denominations: [
          {
            name: 'AWETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing Wrapped ETH',
        networkLocation: {
          contractAddress: '0x030ba81f1c18d280636f32af80b9aad02cf0854e'
        }
      },
      '9ff58f4ffb29fa2266ab25e75e2a8b3503311656': {
        currencyCode: 'AWBTC',
        denominations: [
          {
            name: 'AWBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Aave Interest Bearing Wrapped BTC',
        networkLocation: {
          contractAddress: '0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656'
        }
      },
      '35f6b052c598d933d69a4eec4d04c73a191fe6c2': {
        currencyCode: 'ASNX',
        denominations: [
          {
            name: 'ASNX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing SNX',
        networkLocation: {
          contractAddress: '0x35f6b052c598d933d69a4eec4d04c73a191fe6c2'
        }
      },
      cc12abe4ff81c9378d670de1b57f8e0dd228d77a: {
        currencyCode: 'AREN',
        denominations: [
          {
            name: 'AREN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing REN',
        networkLocation: {
          contractAddress: '0xcc12abe4ff81c9378d670de1b57f8e0dd228d77a'
        }
      },
      '3ed3b47dd13ec9a98b44e6204a523e766b225811': {
        currencyCode: 'AUSDT',
        denominations: [
          {
            name: 'AUSDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Aave Interest Bearing USDT',
        networkLocation: {
          contractAddress: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811'
        }
      },
      c713e5e149d5d0715dcd1c156a020976e7e56b88: {
        currencyCode: 'AMKR',
        denominations: [
          {
            name: 'AMKR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing MKR',
        networkLocation: {
          contractAddress: '0xc713e5e149d5d0715dcd1c156a020976e7e56b88'
        }
      },
      a685a61171bb30d4072b338c80cb7b2c865c873e: {
        currencyCode: 'AMANA',
        denominations: [
          {
            name: 'AMANA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing MANA',
        networkLocation: {
          contractAddress: '0xa685a61171bb30d4072b338c80cb7b2c865c873e'
        }
      },
      df7ff54aacacbff42dfe29dd6144a69b629f8c9e: {
        currencyCode: 'AZRX',
        denominations: [
          {
            name: 'AZRX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing ZRX',
        networkLocation: {
          contractAddress: '0xdf7ff54aacacbff42dfe29dd6144a69b629f8c9e'
        }
      },
      '39c6b3e42d6a679d7d776778fe880bc9487c2eda': {
        currencyCode: 'AKNC',
        denominations: [
          {
            name: 'AKNC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing KNC',
        networkLocation: {
          contractAddress: '0x39c6b3e42d6a679d7d776778fe880bc9487c2eda'
        }
      },
      bcca60bb61934080951369a648fb03df4f96263c: {
        currencyCode: 'AUSDC',
        denominations: [
          {
            name: 'AUSDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'Aave Interest Bearing USDC',
        networkLocation: {
          contractAddress: '0xbcca60bb61934080951369a648fb03df4f96263c'
        }
      },
      '6c5024cd4f8a59110119c56f8933403a539555eb': {
        currencyCode: 'ASUSD',
        denominations: [
          {
            name: 'ASUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing SUSD',
        networkLocation: {
          contractAddress: '0x6c5024cd4f8a59110119c56f8933403a539555eb'
        }
      },
      b9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1: {
        currencyCode: 'AUNI',
        denominations: [
          {
            name: 'AUNI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave Interest Bearing UNI',
        networkLocation: {
          contractAddress: '0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1'
        }
      },
      '2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        currencyCode: 'WBTC',
        denominations: [
          {
            name: 'WBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Wrapped Bitcoin',
        networkLocation: {
          contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
        }
      },
      '0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
        currencyCode: 'YFI',
        denominations: [
          {
            name: 'YFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yearn Finance',
        networkLocation: {
          contractAddress: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'
        }
      },
      d533a949740bb3306d119cc777fa900ba034cd52: {
        currencyCode: 'CRV',
        denominations: [
          {
            name: 'CRV',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Curve DAO Token',
        networkLocation: {
          contractAddress: '0xD533a949740bb3306d119CC777fa900bA034cd52'
        }
      },
      ba100000625a3754423978a60c9317c58a424e3d: {
        currencyCode: 'BAL',
        denominations: [
          {
            name: 'BAL',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Balancer',
        networkLocation: {
          contractAddress: '0xba100000625a3754423978a60c9317c58a424e3d'
        }
      },
      '6b3595068778dd592e39a122f4f5a5cf09c90fe2': {
        currencyCode: 'SUSHI',
        denominations: [
          {
            name: 'SUSHI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Sushi Token',
        networkLocation: {
          contractAddress: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
        }
      },
      '04fa0d235c4abf4bcf4787af4cf447de572ef828': {
        currencyCode: 'UMA',
        denominations: [
          {
            name: 'UMA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'UMA',
        networkLocation: {
          contractAddress: '0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828'
        }
      },
      '3472a5a71965499acd81997a54bba8d852c6e53d': {
        currencyCode: 'BADGER',
        denominations: [
          {
            name: 'BADGER',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Badger',
        networkLocation: {
          contractAddress: '0x3472A5A71965499acd81997a54BBA8D852C6E53d'
        }
      },
      '875773784af8135ea0ef43b5a374aad105c5d39e': {
        currencyCode: 'IDLE',
        denominations: [
          {
            name: 'IDLE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Idle Finance',
        networkLocation: {
          contractAddress: '0x875773784Af8135eA0ef43b5a374AaD105c5D39e'
        }
      },
      d7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b: {
        currencyCode: 'NXM',
        denominations: [
          {
            name: 'NXM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Nexus Mutual',
        networkLocation: {
          contractAddress: '0xd7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b'
        }
      },
      '2ba592f78db6436527729929aaf6c908497cb200': {
        currencyCode: 'CREAM',
        denominations: [
          {
            name: 'CREAM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Cream',
        networkLocation: {
          contractAddress: '0x2ba592F78dB6436527729929AAf6c908497cB200'
        }
      },
      '429881672b9ae42b8eba0e26cd9c73711b891ca5': {
        currencyCode: 'PICKLE',
        denominations: [
          {
            name: 'PICKLE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'PickleToken',
        networkLocation: {
          contractAddress: '0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5'
        }
      },
      '38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1': {
        currencyCode: 'CVP',
        denominations: [
          {
            name: 'CVP',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Concentrated Voting Power',
        networkLocation: {
          contractAddress: '0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1'
        }
      },
      fa5047c9c78b8877af97bdcb85db743fd7313d4a: {
        currencyCode: 'ROOK',
        denominations: [
          {
            name: 'ROOK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Keeper DAO',
        networkLocation: {
          contractAddress: '0xfA5047c9c78B8877af97BDcb85Db743fD7313d4a'
        }
      },
      ad32a8e6220741182940c5abf610bde99e737b2d: {
        currencyCode: 'DOUGH',
        denominations: [
          {
            name: 'DOUGH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'PieDAO',
        networkLocation: {
          contractAddress: '0xad32a8e6220741182940c5abf610bde99e737b2d'
        }
      },
      ffffffff2ba8f66d4e51811c5190992176930278: {
        currencyCode: 'COMBO',
        denominations: [
          {
            name: 'COMBO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'COMBO',
        networkLocation: {
          contractAddress: '0xffffffff2ba8f66d4e51811c5190992176930278'
        }
      },
      '0954906da0bf32d5479e25f46056d22f08464cab': {
        currencyCode: 'INDEX',
        denominations: [
          {
            name: 'INDEX',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'INDEX COOP',
        networkLocation: {
          contractAddress: '0x0954906da0Bf32d5479e25f46056d22f08464cab'
        }
      },
      c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2: {
        currencyCode: 'WETH',
        denominations: [
          {
            name: 'WETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wrapped ETH',
        networkLocation: {
          contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        }
      },
      eb4c2781e4eba804ce9a9803c67d0893436bb27d: {
        currencyCode: 'RENBTC',
        denominations: [
          {
            name: 'RENBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Ren BTC',
        networkLocation: {
          contractAddress: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d'
        }
      },
      '459086f2376525bdceba5bdda135e4e9d3fef5bf': {
        currencyCode: 'RENBCH',
        denominations: [
          {
            name: 'RENBCH',
            multiplier: '100000000'
          }
        ],
        displayName: 'Ren BCH',
        networkLocation: {
          contractAddress: '0x459086f2376525bdceba5bdda135e4e9d3fef5bf'
        }
      },
      '1c5db575e2ff833e46a2e9864c22f4b22e0b37c2': {
        currencyCode: 'RENZEC',
        denominations: [
          {
            name: 'RENZEC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Ren ZEC',
        networkLocation: {
          contractAddress: '0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2'
        }
      },
      '8daebade922df735c38c80c7ebd708af50815faa': {
        currencyCode: 'TBTC',
        denominations: [
          {
            name: 'TBTC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'tBTC',
        networkLocation: {
          contractAddress: '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa'
        }
      },
      '1494ca1f11d487c2bbe4543e90080aeba4ba3c2b': {
        currencyCode: 'DPI',
        denominations: [
          {
            name: 'DPI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'DefiPulse Index',
        networkLocation: {
          contractAddress: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b'
        }
      },
      b4bebd34f6daafd808f73de0d10235a92fbb6c3d: {
        currencyCode: 'YETI',
        denominations: [
          {
            name: 'YETI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yearn Ecosystem Token Index',
        networkLocation: {
          contractAddress: '0xb4bebd34f6daafd808f73de0d10235a92fbb6c3d'
        }
      },
      ba11d00c5f74255f56a5e366f4f77f5a186d7f55: {
        currencyCode: 'BAND',
        denominations: [
          {
            name: 'BAND',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'BAND',
        networkLocation: {
          contractAddress: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55'
        }
      },
      '408e41876cccdc0f92210600ef50372656052a38': {
        currencyCode: 'REN',
        denominations: [
          {
            name: 'REN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Ren',
        networkLocation: {
          contractAddress: '0x408e41876cccdc0f92210600ef50372656052a38'
        }
      },
      d46ba6d942050d489dbd938a2c909a5d5039a161: {
        currencyCode: 'AMPL',
        denominations: [
          {
            name: 'AMPL',
            multiplier: '1000000000'
          }
        ],
        displayName: 'Ampleforth',
        networkLocation: {
          contractAddress: '0xd46ba6d942050d489dbd938a2c909a5d5039a161'
        }
      },
      '967da4048cd07ab37855c090aaf366e4ce1b9f48': {
        currencyCode: 'OCEAN',
        denominations: [
          {
            name: 'OCEAN',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'OCEAN',
        networkLocation: {
          contractAddress: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
        }
      },
      '7dd9c5cba05e151c895fde1cf355c9a1d5da6429': {
        currencyCode: 'GLM',
        denominations: [
          {
            name: 'GLM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Golem',
        networkLocation: {
          contractAddress: '0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429'
        }
      },
      '1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        currencyCode: 'UNI',
        denominations: [
          {
            name: 'UNI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Uniswap',
        networkLocation: {
          contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
        }
      },
      '7d1afa7b718fb893db30a3abc0cfc608aacfebb0': {
        currencyCode: 'MATIC',
        denominations: [
          {
            name: 'MATIC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Polygon',
        networkLocation: {
          contractAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
        }
      },
      b8c77482e45f1f44de1745f52c74426c631bdd52: {
        currencyCode: 'BNB',
        denominations: [
          {
            name: 'BNB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance',
        networkLocation: {
          contractAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
        }
      },
      '4e15361fd6b4bb609fa63c81a2be19d873717870': {
        currencyCode: 'FTM',
        denominations: [
          {
            name: 'FTM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Fantom',
        networkLocation: {
          contractAddress: '0x4e15361fd6b4bb609fa63c81a2be19d873717870'
        }
      },
      '111111111117dc0aa78b770fa6a738034120c302': {
        currencyCode: '1INCH',
        denominations: [
          {
            name: '1INCH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: '1inch',
        networkLocation: {
          contractAddress: '0x111111111117dc0aa78b770fa6a738034120c302'
        }
      }
    },
    customTokens: {}
  },
  ethereumclassic: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'ETC',
      displayName: 'Ethereum Classic',
      pluginId: 'ethereumclassic',
      walletType: 'wallet:ethereumclassic',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: ['https://www.ethercluster.com/etc'],
          evmScanApiServers: ['https://blockscout.com/etc/mainnet'],
          blockcypherApiServers: [],
          blockbookServers: ['https://etcbook.guarda.co', 'https://etc1.trezor.io'],
          uriNetworks: ['ethereumclassic', 'etherclass'],
          ercTokenStandard: 'ERC20',
          chainParams: {
            chainId: 61,
            name: 'Ethereum Classic'
          },
          hdPathCoinType: 61,
          checkUnconfirmedTransactions: false,
          iosAllowedTokens: {},
          blockchairApiServers: [],
          alethioApiServers: [],
          alethioCurrencies: null,
          amberdataRpcServers: [],
          amberdataApiServers: [],
          amberDataBlockchainId: '',
          pluginMnemonicKeyName: 'ethereumclassicMnemonic',
          pluginRegularKeyName: 'ethereumclassicKey',
          ethGasStationUrl: null,
          defaultNetworkFees: {
            default: {
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '200000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '1000000001',
                standardFeeLow: '40000000001',
                standardFeeHigh: '300000000001',
                standardFeeLowAmount: '100000000000000000',
                standardFeeHighAmount: '10000000000000000000',
                highFee: '40000000001',
                minGasPrice: '1000000000'
              }
            },
            '1983987abc9837fbabc0982347ad828': {
              gasLimit: {
                regularTransaction: '21002',
                tokenTransaction: '37124'
              },
              gasPrice: {
                lowFee: '1000000002',
                standardFeeLow: '40000000002',
                standardFeeHigh: '300000000002',
                standardFeeLowAmount: '200000000000000000',
                standardFeeHighAmount: '20000000000000000000',
                highFee: '40000000002'
              }
            },
            '2983987abc9837fbabc0982347ad828': {
              gasLimit: {
                regularTransaction: '21002',
                tokenTransaction: '37124'
              }
            }
          }
        }
      },
      addressExplorer: 'https://blockscout.com/etc/mainnet/address/%s',
      transactionExplorer: 'https://blockscout.com/etc/mainnet/tx/%s',
      denominations: [
        {
          name: 'ETC',
          multiplier: '1000000000000000000',
          symbol: 'Ξ'
        },
        {
          name: 'mETC',
          multiplier: '1000000000000000',
          symbol: 'mΞ'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  fantom: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'FTM',
      displayName: 'Fantom',
      pluginId: 'fantom',
      walletType: 'wallet:fantom',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: ['https://polished-empty-cloud.fantom.quiknode.pro', 'https://rpc.ftm.tools'],
          evmScanApiServers: ['https://api.ftmscan.com'],
          blockcypherApiServers: [],
          blockbookServers: [],
          uriNetworks: ['fantom'],
          ercTokenStandard: 'ERC20',
          chainParams: {
            chainId: 250,
            name: 'Fantom Opera'
          },
          hdPathCoinType: 60,
          feeUpdateFrequencyMs: 60000,
          supportsEIP1559: true,
          checkUnconfirmedTransactions: false,
          iosAllowedTokens: {},
          blockchairApiServers: [],
          alethioApiServers: [],
          alethioCurrencies: null,
          amberdataRpcServers: [],
          amberdataApiServers: [],
          amberDataBlockchainId: '',
          pluginMnemonicKeyName: 'fantomMnemonic',
          pluginRegularKeyName: 'fantomKey',
          ethGasStationUrl: null,
          defaultNetworkFees: {
            default: {
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '200000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '1000000001',
                standardFeeLow: '40000000001',
                standardFeeHigh: '300000000001',
                standardFeeLowAmount: '100000000000000000',
                standardFeeHighAmount: '10000000000000000000',
                highFee: '40000000001',
                minGasPrice: '1000000000'
              }
            }
          }
        }
      },
      addressExplorer: 'https://ftmscan.com/address/%s',
      transactionExplorer: 'https://ftmscan.com/tx/%s',
      denominations: [
        {
          name: 'FTM',
          multiplier: '1000000000000000000',
          symbol: 'F'
        }
      ],
      metaTokens: [
        {
          currencyCode: 'FUSDT',
          currencyName: 'Frapped Tether',
          denominations: [
            {
              name: 'FUSDT',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0x049d68029688eabf473097a2fc38ef61633a3c7a'
        },
        {
          currencyCode: 'FBTC',
          currencyName: 'Frapped Bitcoin',
          denominations: [
            {
              name: 'FBTC',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e'
        },
        {
          currencyCode: 'USDC',
          currencyName: 'USD Coin',
          denominations: [
            {
              name: 'USDC',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0x04068da6c83afcfa0e13ba15a6696662335d5b75'
        },
        {
          currencyCode: 'FETH',
          currencyName: 'Frapped Ethereum',
          denominations: [
            {
              name: 'FETH',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad'
        },
        {
          currencyCode: 'WFTM',
          currencyName: 'Wrapped Fantom',
          denominations: [
            {
              name: 'WFTM',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
        },
        {
          currencyCode: 'BOO',
          currencyName: 'SpookyToken',
          denominations: [
            {
              name: 'BOO',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x841fad6eae12c286d1fd18d1d525dffa75c7effe'
        },
        {
          currencyCode: 'xBOO',
          currencyName: 'Boo MirrorWorld',
          denominations: [
            {
              name: 'xBOO',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598'
        },
        {
          currencyCode: 'MAI',
          currencyName: 'miMATIC',
          denominations: [
            {
              name: 'MAI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xfB98B335551a418cD0737375a2ea0ded62Ea213b'
        },
        {
          currencyCode: 'TOMB',
          currencyName: 'Tomb',
          denominations: [
            {
              name: 'TOMB',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7'
        },
        {
          currencyCode: 'TBOND',
          currencyName: 'Tomb Bonds',
          denominations: [
            {
              name: 'TBOND',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x24248CD1747348bDC971a5395f4b3cd7feE94ea0'
        },
        {
          currencyCode: 'TSHARE',
          currencyName: 'Tomb Shares',
          denominations: [
            {
              name: 'TSHARE',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
        }
      ]
    },
    allTokens: {
      '049d68029688eabf473097a2fc38ef61633a3c7a': {
        currencyCode: 'FUSDT',
        denominations: [
          {
            name: 'FUSDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Frapped Tether',
        networkLocation: {
          contractAddress: '0x049d68029688eabf473097a2fc38ef61633a3c7a'
        }
      },
      e1146b9ac456fcbb60644c36fd3f868a9072fc6e: {
        currencyCode: 'FBTC',
        denominations: [
          {
            name: 'FBTC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Frapped Bitcoin',
        networkLocation: {
          contractAddress: '0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e'
        }
      },
      '04068da6c83afcfa0e13ba15a6696662335d5b75': {
        currencyCode: 'USDC',
        denominations: [
          {
            name: 'USDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0x04068da6c83afcfa0e13ba15a6696662335d5b75'
        }
      },
      '658b0c7613e890ee50b8c4bc6a3f41ef411208ad': {
        currencyCode: 'FETH',
        denominations: [
          {
            name: 'FETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Frapped Ethereum',
        networkLocation: {
          contractAddress: '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad'
        }
      },
      '21be370d5312f44cb42ce377bc9b8a0cef1a4c83': {
        currencyCode: 'WFTM',
        denominations: [
          {
            name: 'WFTM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wrapped Fantom',
        networkLocation: {
          contractAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
        }
      },
      '841fad6eae12c286d1fd18d1d525dffa75c7effe': {
        currencyCode: 'BOO',
        denominations: [
          {
            name: 'BOO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'SpookyToken',
        networkLocation: {
          contractAddress: '0x841fad6eae12c286d1fd18d1d525dffa75c7effe'
        }
      },
      a48d959ae2e88f1daa7d5f611e01908106de7598: {
        currencyCode: 'xBOO',
        denominations: [
          {
            name: 'xBOO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Boo MirrorWorld',
        networkLocation: {
          contractAddress: '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598'
        }
      },
      fb98b335551a418cd0737375a2ea0ded62ea213b: {
        currencyCode: 'MAI',
        denominations: [
          {
            name: 'MAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'miMATIC',
        networkLocation: {
          contractAddress: '0xfB98B335551a418cD0737375a2ea0ded62Ea213b'
        }
      },
      '6c021ae822bea943b2e66552bde1d2696a53fbb7': {
        currencyCode: 'TOMB',
        denominations: [
          {
            name: 'TOMB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Tomb',
        networkLocation: {
          contractAddress: '0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7'
        }
      },
      '24248cd1747348bdc971a5395f4b3cd7fee94ea0': {
        currencyCode: 'TBOND',
        denominations: [
          {
            name: 'TBOND',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Tomb Bonds',
        networkLocation: {
          contractAddress: '0x24248CD1747348bDC971a5395f4b3cd7feE94ea0'
        }
      },
      '4cdf39285d7ca8eb3f090fda0c069ba5f4145b37': {
        currencyCode: 'TSHARE',
        denominations: [
          {
            name: 'TSHARE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Tomb Shares',
        networkLocation: {
          contractAddress: '0x4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
        }
      }
    },
    builtinTokens: {
      '049d68029688eabf473097a2fc38ef61633a3c7a': {
        currencyCode: 'FUSDT',
        denominations: [
          {
            name: 'FUSDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Frapped Tether',
        networkLocation: {
          contractAddress: '0x049d68029688eabf473097a2fc38ef61633a3c7a'
        }
      },
      e1146b9ac456fcbb60644c36fd3f868a9072fc6e: {
        currencyCode: 'FBTC',
        denominations: [
          {
            name: 'FBTC',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Frapped Bitcoin',
        networkLocation: {
          contractAddress: '0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e'
        }
      },
      '04068da6c83afcfa0e13ba15a6696662335d5b75': {
        currencyCode: 'USDC',
        denominations: [
          {
            name: 'USDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0x04068da6c83afcfa0e13ba15a6696662335d5b75'
        }
      },
      '658b0c7613e890ee50b8c4bc6a3f41ef411208ad': {
        currencyCode: 'FETH',
        denominations: [
          {
            name: 'FETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Frapped Ethereum',
        networkLocation: {
          contractAddress: '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad'
        }
      },
      '21be370d5312f44cb42ce377bc9b8a0cef1a4c83': {
        currencyCode: 'WFTM',
        denominations: [
          {
            name: 'WFTM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wrapped Fantom',
        networkLocation: {
          contractAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
        }
      },
      '841fad6eae12c286d1fd18d1d525dffa75c7effe': {
        currencyCode: 'BOO',
        denominations: [
          {
            name: 'BOO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'SpookyToken',
        networkLocation: {
          contractAddress: '0x841fad6eae12c286d1fd18d1d525dffa75c7effe'
        }
      },
      a48d959ae2e88f1daa7d5f611e01908106de7598: {
        currencyCode: 'xBOO',
        denominations: [
          {
            name: 'xBOO',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Boo MirrorWorld',
        networkLocation: {
          contractAddress: '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598'
        }
      },
      fb98b335551a418cd0737375a2ea0ded62ea213b: {
        currencyCode: 'MAI',
        denominations: [
          {
            name: 'MAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'miMATIC',
        networkLocation: {
          contractAddress: '0xfB98B335551a418cD0737375a2ea0ded62Ea213b'
        }
      },
      '6c021ae822bea943b2e66552bde1d2696a53fbb7': {
        currencyCode: 'TOMB',
        denominations: [
          {
            name: 'TOMB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Tomb',
        networkLocation: {
          contractAddress: '0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7'
        }
      },
      '24248cd1747348bdc971a5395f4b3cd7fee94ea0': {
        currencyCode: 'TBOND',
        denominations: [
          {
            name: 'TBOND',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Tomb Bonds',
        networkLocation: {
          contractAddress: '0x24248CD1747348bDC971a5395f4b3cd7feE94ea0'
        }
      },
      '4cdf39285d7ca8eb3f090fda0c069ba5f4145b37': {
        currencyCode: 'TSHARE',
        denominations: [
          {
            name: 'TSHARE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Tomb Shares',
        networkLocation: {
          contractAddress: '0x4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'
        }
      }
    },
    customTokens: {}
  },
  rsk: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'RBTC',
      displayName: 'RSK',
      pluginId: 'rsk',
      walletType: 'wallet:rsk',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: ['https://public-node.rsk.co'],
          evmScanApiServers: ['https://blockscout.com/rsk/mainnet'],
          blockcypherApiServers: [],
          blockbookServers: [],
          blockchairApiServers: [],
          alethioApiServers: [],
          alethioCurrencies: null,
          amberdataRpcServers: [],
          amberdataApiServers: [],
          amberDataBlockchainId: '',
          uriNetworks: ['rsk', 'rbtc'],
          ercTokenStandard: 'RRC20',
          chainParams: {
            chainId: 30,
            name: 'RSK Mainnet'
          },
          checkUnconfirmedTransactions: false,
          iosAllowedTokens: {
            RIF: true
          },
          hdPathCoinType: 137,
          pluginMnemonicKeyName: 'rskMnemonic',
          pluginRegularKeyName: 'rskKey',
          ethGasStationUrl: null,
          defaultNetworkFees: {
            default: {
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '200000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '59240000',
                standardFeeLow: '59240000',
                standardFeeHigh: '59240000',
                standardFeeLowAmount: '59240000',
                standardFeeHighAmount: '59240000',
                highFee: '59240000',
                minGasPrice: '59240000'
              }
            }
          }
        }
      },
      addressExplorer: 'https://explorer.rsk.co/address/%s',
      transactionExplorer: 'https://explorer.rsk.co/tx/%s',
      denominations: [
        {
          name: 'RBTC',
          multiplier: '1000000000000000000',
          symbol: 'RBTC'
        }
      ],
      metaTokens: [
        {
          currencyCode: 'RIF',
          currencyName: 'RIF Token',
          denominations: [
            {
              name: 'RIF',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5'
        }
      ]
    },
    allTokens: {
      '2acc95758f8b5f583470ba265eb685a8f45fc9d5': {
        currencyCode: 'RIF',
        denominations: [
          {
            name: 'RIF',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'RIF Token',
        networkLocation: {
          contractAddress: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5'
        }
      }
    },
    builtinTokens: {
      '2acc95758f8b5f583470ba265eb685a8f45fc9d5': {
        currencyCode: 'RIF',
        denominations: [
          {
            name: 'RIF',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'RIF Token',
        networkLocation: {
          contractAddress: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5'
        }
      }
    },
    customTokens: {}
  },
  polygon: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'MATIC',
      displayName: 'Polygon',
      pluginId: 'polygon',
      walletType: 'wallet:polygon',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: [
            'https://polygon-rpc.com/',
            'https://rpc.polycat.finance',
            'https://rpc-mainnet.maticvigil.com',
            'https://matic-mainnet.chainstacklabs.com',
            'https://rpc-mainnet.matic.quiknode.pro'
          ],
          evmScanApiServers: ['https://api.polygonscan.com'],
          blockcypherApiServers: [],
          blockbookServers: [],
          uriNetworks: ['polygon'],
          ercTokenStandard: 'ERC20',
          chainParams: {
            chainId: 137,
            name: 'MATIC Mainnet'
          },
          supportsEIP1559: true,
          hdPathCoinType: 60,
          checkUnconfirmedTransactions: false,
          iosAllowedTokens: {},
          blockchairApiServers: [],
          alethioApiServers: [],
          alethioCurrencies: null,
          amberdataRpcServers: [],
          amberdataApiServers: [],
          amberDataBlockchainId: '',
          pluginMnemonicKeyName: 'polygonMnemonic',
          pluginRegularKeyName: 'polygonKey',
          ethGasStationUrl: 'https://gasstation-mainnet.matic.network/',
          defaultNetworkFees: {
            default: {
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '300000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '30000000001',
                standardFeeLow: '36000000000',
                standardFeeHigh: '100000000000',
                standardFeeLowAmount: '100000000000000000',
                standardFeeHighAmount: '10000000000000000000',
                highFee: '216000000000',
                minGasPrice: '30000000000'
              }
            }
          }
        }
      },
      addressExplorer: 'https://polygonscan.com/address/%s',
      transactionExplorer: 'https://polygonscan.com/tx/%s',
      denominations: [
        {
          name: 'MATIC',
          multiplier: '1000000000000000000',
          symbol: 'MATIC'
        },
        {
          name: 'mMATIC',
          multiplier: '1000000000000000',
          symbol: 'mMATIC'
        }
      ],
      metaTokens: [
        {
          currencyCode: 'USDC',
          currencyName: 'USD Coin',
          denominations: [
            {
              name: 'USDC',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
        },
        {
          currencyCode: 'DAI',
          currencyName: 'Dai Stablecoin',
          denominations: [
            {
              name: 'DAI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'
        },
        {
          currencyCode: 'USDT',
          currencyName: 'Tether',
          denominations: [
            {
              name: 'USDT',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
        },
        {
          currencyCode: 'AAVE',
          currencyName: 'Aave',
          denominations: [
            {
              name: 'AAVE',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xd6df932a45c0f255f85145f286ea0b292b21c90b'
        },
        {
          currencyCode: 'WBTC',
          currencyName: 'Wrapped Bitcoin',
          denominations: [
            {
              name: 'WBTC',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'
        },
        {
          currencyCode: 'YFI',
          currencyName: 'Yearn Finance',
          denominations: [
            {
              name: 'YFI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xda537104d6a5edd53c6fbba9a898708e465260b6'
        },
        {
          currencyCode: 'WETH',
          currencyName: 'Wrapped ETH',
          denominations: [
            {
              name: 'WETH',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
        },
        {
          currencyCode: 'BUSD',
          currencyName: 'Binance USD',
          denominations: [
            {
              name: 'BUSD',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7'
        },
        {
          currencyCode: 'UNI',
          currencyName: 'Uniswap',
          denominations: [
            {
              name: 'UNI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xb33eaad8d922b1083446dc23f610c2567fb5180f'
        },
        {
          currencyCode: 'FTM',
          currencyName: 'Fantom',
          denominations: [
            {
              name: 'FTM',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xc9c1c1c20b3658f8787cc2fd702267791f224ce1'
        },
        {
          currencyCode: 'MKR',
          currencyName: 'Maker',
          denominations: [
            {
              name: 'MKR',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x6f7C932e7684666C9fd1d44527765433e01fF61d'
        },
        {
          currencyCode: 'TUSD',
          currencyName: 'TrueUSD',
          denominations: [
            {
              name: 'TUSD',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x2e1ad108ff1d8c782fcbbb89aad783ac49586756'
        },
        {
          currencyCode: 'BNB',
          currencyName: 'Binance',
          denominations: [
            {
              name: 'BNB',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3'
        },
        {
          currencyCode: 'MANA',
          currencyName: 'Decentraland',
          denominations: [
            {
              name: 'MANA',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4'
        },
        {
          currencyCode: 'LINK',
          currencyName: 'Chainlink',
          denominations: [
            {
              name: 'LINK',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39'
        }
      ]
    },
    allTokens: {
      '2791bca1f2de4661ed88a30c99a7a9449aa84174': {
        currencyCode: 'USDC',
        denominations: [
          {
            name: 'USDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
        }
      },
      '8f3cf7ad23cd3cadbd9735aff958023239c6a063': {
        currencyCode: 'DAI',
        denominations: [
          {
            name: 'DAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Dai Stablecoin',
        networkLocation: {
          contractAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'
        }
      },
      c2132d05d31c914a87c6611c10748aeb04b58e8f: {
        currencyCode: 'USDT',
        denominations: [
          {
            name: 'USDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Tether',
        networkLocation: {
          contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
        }
      },
      d6df932a45c0f255f85145f286ea0b292b21c90b: {
        currencyCode: 'AAVE',
        denominations: [
          {
            name: 'AAVE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave',
        networkLocation: {
          contractAddress: '0xd6df932a45c0f255f85145f286ea0b292b21c90b'
        }
      },
      '1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': {
        currencyCode: 'WBTC',
        denominations: [
          {
            name: 'WBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Wrapped Bitcoin',
        networkLocation: {
          contractAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'
        }
      },
      da537104d6a5edd53c6fbba9a898708e465260b6: {
        currencyCode: 'YFI',
        denominations: [
          {
            name: 'YFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yearn Finance',
        networkLocation: {
          contractAddress: '0xda537104d6a5edd53c6fbba9a898708e465260b6'
        }
      },
      '7ceb23fd6bc0add59e62ac25578270cff1b9f619': {
        currencyCode: 'WETH',
        denominations: [
          {
            name: 'WETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wrapped ETH',
        networkLocation: {
          contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
        }
      },
      dab529f40e671a1d4bf91361c21bf9f0c9712ab7: {
        currencyCode: 'BUSD',
        denominations: [
          {
            name: 'BUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance USD',
        networkLocation: {
          contractAddress: '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7'
        }
      },
      b33eaad8d922b1083446dc23f610c2567fb5180f: {
        currencyCode: 'UNI',
        denominations: [
          {
            name: 'UNI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Uniswap',
        networkLocation: {
          contractAddress: '0xb33eaad8d922b1083446dc23f610c2567fb5180f'
        }
      },
      c9c1c1c20b3658f8787cc2fd702267791f224ce1: {
        currencyCode: 'FTM',
        denominations: [
          {
            name: 'FTM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Fantom',
        networkLocation: {
          contractAddress: '0xc9c1c1c20b3658f8787cc2fd702267791f224ce1'
        }
      },
      '6f7c932e7684666c9fd1d44527765433e01ff61d': {
        currencyCode: 'MKR',
        denominations: [
          {
            name: 'MKR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Maker',
        networkLocation: {
          contractAddress: '0x6f7C932e7684666C9fd1d44527765433e01fF61d'
        }
      },
      '2e1ad108ff1d8c782fcbbb89aad783ac49586756': {
        currencyCode: 'TUSD',
        denominations: [
          {
            name: 'TUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'TrueUSD',
        networkLocation: {
          contractAddress: '0x2e1ad108ff1d8c782fcbbb89aad783ac49586756'
        }
      },
      '3ba4c387f786bfee076a58914f5bd38d668b42c3': {
        currencyCode: 'BNB',
        denominations: [
          {
            name: 'BNB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance',
        networkLocation: {
          contractAddress: '0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3'
        }
      },
      a1c57f48f0deb89f569dfbe6e2b7f46d33606fd4: {
        currencyCode: 'MANA',
        denominations: [
          {
            name: 'MANA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Decentraland',
        networkLocation: {
          contractAddress: '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4'
        }
      },
      '53e0bca35ec356bd5dddfebbd1fc0fd03fabad39': {
        currencyCode: 'LINK',
        denominations: [
          {
            name: 'LINK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Chainlink',
        networkLocation: {
          contractAddress: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39'
        }
      }
    },
    builtinTokens: {
      '2791bca1f2de4661ed88a30c99a7a9449aa84174': {
        currencyCode: 'USDC',
        denominations: [
          {
            name: 'USDC',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
        }
      },
      '8f3cf7ad23cd3cadbd9735aff958023239c6a063': {
        currencyCode: 'DAI',
        denominations: [
          {
            name: 'DAI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Dai Stablecoin',
        networkLocation: {
          contractAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'
        }
      },
      c2132d05d31c914a87c6611c10748aeb04b58e8f: {
        currencyCode: 'USDT',
        denominations: [
          {
            name: 'USDT',
            multiplier: '1000000'
          }
        ],
        displayName: 'Tether',
        networkLocation: {
          contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
        }
      },
      d6df932a45c0f255f85145f286ea0b292b21c90b: {
        currencyCode: 'AAVE',
        denominations: [
          {
            name: 'AAVE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Aave',
        networkLocation: {
          contractAddress: '0xd6df932a45c0f255f85145f286ea0b292b21c90b'
        }
      },
      '1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': {
        currencyCode: 'WBTC',
        denominations: [
          {
            name: 'WBTC',
            multiplier: '100000000'
          }
        ],
        displayName: 'Wrapped Bitcoin',
        networkLocation: {
          contractAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'
        }
      },
      da537104d6a5edd53c6fbba9a898708e465260b6: {
        currencyCode: 'YFI',
        denominations: [
          {
            name: 'YFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yearn Finance',
        networkLocation: {
          contractAddress: '0xda537104d6a5edd53c6fbba9a898708e465260b6'
        }
      },
      '7ceb23fd6bc0add59e62ac25578270cff1b9f619': {
        currencyCode: 'WETH',
        denominations: [
          {
            name: 'WETH',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Wrapped ETH',
        networkLocation: {
          contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
        }
      },
      dab529f40e671a1d4bf91361c21bf9f0c9712ab7: {
        currencyCode: 'BUSD',
        denominations: [
          {
            name: 'BUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance USD',
        networkLocation: {
          contractAddress: '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7'
        }
      },
      b33eaad8d922b1083446dc23f610c2567fb5180f: {
        currencyCode: 'UNI',
        denominations: [
          {
            name: 'UNI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Uniswap',
        networkLocation: {
          contractAddress: '0xb33eaad8d922b1083446dc23f610c2567fb5180f'
        }
      },
      c9c1c1c20b3658f8787cc2fd702267791f224ce1: {
        currencyCode: 'FTM',
        denominations: [
          {
            name: 'FTM',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Fantom',
        networkLocation: {
          contractAddress: '0xc9c1c1c20b3658f8787cc2fd702267791f224ce1'
        }
      },
      '6f7c932e7684666c9fd1d44527765433e01ff61d': {
        currencyCode: 'MKR',
        denominations: [
          {
            name: 'MKR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Maker',
        networkLocation: {
          contractAddress: '0x6f7C932e7684666C9fd1d44527765433e01fF61d'
        }
      },
      '2e1ad108ff1d8c782fcbbb89aad783ac49586756': {
        currencyCode: 'TUSD',
        denominations: [
          {
            name: 'TUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'TrueUSD',
        networkLocation: {
          contractAddress: '0x2e1ad108ff1d8c782fcbbb89aad783ac49586756'
        }
      },
      '3ba4c387f786bfee076a58914f5bd38d668b42c3': {
        currencyCode: 'BNB',
        denominations: [
          {
            name: 'BNB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance',
        networkLocation: {
          contractAddress: '0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3'
        }
      },
      a1c57f48f0deb89f569dfbe6e2b7f46d33606fd4: {
        currencyCode: 'MANA',
        denominations: [
          {
            name: 'MANA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Decentraland',
        networkLocation: {
          contractAddress: '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4'
        }
      },
      '53e0bca35ec356bd5dddfebbd1fc0fd03fabad39': {
        currencyCode: 'LINK',
        denominations: [
          {
            name: 'LINK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Chainlink',
        networkLocation: {
          contractAddress: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39'
        }
      }
    },
    customTokens: {}
  },
  celo: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'CELO',
      displayName: 'Celo',
      pluginId: 'celo',
      walletType: 'wallet:celo',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: ['https://forno.celo.org'],
          evmScanApiServers: ['https://explorer.celo.org/api'],
          blockcypherApiServers: [],
          blockbookServers: [],
          uriNetworks: ['celo'],
          ercTokenStandard: 'ERC20',
          chainParams: {
            chainId: 42220,
            name: 'Celo Mainnet'
          },
          hdPathCoinType: 52752,
          checkUnconfirmedTransactions: false,
          iosAllowedTokens: {},
          blockchairApiServers: [],
          alethioApiServers: [],
          alethioCurrencies: null,
          amberdataRpcServers: [],
          amberdataApiServers: [],
          amberDataBlockchainId: '',
          pluginMnemonicKeyName: 'celoMnemonic',
          pluginRegularKeyName: 'celoKey',
          ethGasStationUrl: null,
          defaultNetworkFees: {
            default: {
              baseFeeMultiplier: {
                lowFee: '1',
                standardFeeLow: '1.25',
                standardFeeHigh: '1.5',
                highFee: '1.75'
              },
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '300000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '25000000000',
                standardFeeLow: '27000000000',
                standardFeeHigh: '30000000000',
                standardFeeLowAmount: '100000000000000000',
                standardFeeHighAmount: '10000000000000000000',
                highFee: '50000000000',
                minGasPrice: '25000000000'
              },
              minPriorityFee: '25000000000'
            }
          }
        }
      },
      addressExplorer: 'https://explorer.celo.org/address/%s',
      transactionExplorer: 'https://explorer.celo.org/tx/%s',
      denominations: [
        {
          name: 'CELO',
          multiplier: '1000000000000000000',
          symbol: 'CELO'
        }
      ],
      metaTokens: [
        {
          currencyCode: 'CUSD',
          currencyName: 'Celo Dollar',
          denominations: [
            {
              name: 'CUSD',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a'
        },
        {
          currencyCode: 'CEUR',
          currencyName: 'Celo Euro',
          denominations: [
            {
              name: 'CEUR',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73'
        }
      ]
    },
    allTokens: {
      '765de816845861e75a25fca122bb6898b8b1282a': {
        currencyCode: 'CUSD',
        denominations: [
          {
            name: 'CUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Celo Dollar',
        networkLocation: {
          contractAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a'
        }
      },
      d8763cba276a3738e6de85b4b3bf5fded6d6ca73: {
        currencyCode: 'CEUR',
        denominations: [
          {
            name: 'CEUR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Celo Euro',
        networkLocation: {
          contractAddress: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73'
        }
      }
    },
    builtinTokens: {
      '765de816845861e75a25fca122bb6898b8b1282a': {
        currencyCode: 'CUSD',
        denominations: [
          {
            name: 'CUSD',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Celo Dollar',
        networkLocation: {
          contractAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a'
        }
      },
      d8763cba276a3738e6de85b4b3bf5fded6d6ca73: {
        currencyCode: 'CEUR',
        denominations: [
          {
            name: 'CEUR',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Celo Euro',
        networkLocation: {
          contractAddress: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73'
        }
      }
    },
    customTokens: {}
  },
  avalanche: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'AVAX',
      displayName: 'Avalanche',
      pluginId: 'avalanche',
      walletType: 'wallet:avalanche',
      canReplaceByFee: true,
      defaultSettings: {
        customFeeSettings: ['gasLimit', 'gasPrice'],
        otherSettings: {
          rpcServers: ['https://api.avax.network/ext/bc/C/rpc'],
          evmScanApiServers: ['https://api.snowtrace.io'],
          blockcypherApiServers: [],
          blockbookServers: [],
          uriNetworks: ['avalanche'],
          ercTokenStandard: 'ERC20',
          chainParams: {
            chainId: 43114,
            name: 'AVAX Mainnet'
          },
          supportsEIP1559: true,
          hdPathCoinType: 9000,
          checkUnconfirmedTransactions: false,
          iosAllowedTokens: {},
          blockchairApiServers: [],
          alethioApiServers: [],
          alethioCurrencies: null,
          amberdataRpcServers: [],
          amberdataApiServers: [],
          amberDataBlockchainId: '',
          pluginMnemonicKeyName: 'avalancheMnemonic',
          pluginRegularKeyName: 'avalancheKey',
          ethGasStationUrl: null,
          defaultNetworkFees: {
            default: {
              baseFeeMultiplier: {
                lowFee: '1',
                standardFeeLow: '1.25',
                standardFeeHigh: '1.5',
                highFee: '1.75'
              },
              gasLimit: {
                regularTransaction: '21000',
                tokenTransaction: '300000',
                minGasLimit: '21000'
              },
              gasPrice: {
                lowFee: '25000000000',
                standardFeeLow: '27000000000',
                standardFeeHigh: '30000000000',
                standardFeeLowAmount: '100000000000000000',
                standardFeeHighAmount: '10000000000000000000',
                highFee: '50000000000',
                minGasPrice: '25000000000'
              },
              minPriorityFee: '25000000000'
            }
          }
        }
      },
      addressExplorer: 'https://snowtrace.io/address/%s',
      transactionExplorer: 'https://snowtrace.io/tx/%s',
      denominations: [
        {
          name: 'AVAX',
          multiplier: '1000000000000000000',
          symbol: 'AVAX'
        }
      ],
      metaTokens: [
        {
          currencyCode: 'PNG',
          currencyName: 'Pangolin',
          denominations: [
            {
              name: 'PNG',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x60781C2586D68229fde47564546784ab3fACA982'
        },
        {
          currencyCode: 'PEFI',
          currencyName: 'Penguin Finance',
          denominations: [
            {
              name: 'PEFI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xe896CDeaAC9615145c0cA09C8Cd5C25bced6384c'
        },
        {
          currencyCode: 'XAVA',
          currencyName: 'Avalaunch',
          denominations: [
            {
              name: 'XAVA',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xd1c3f94DE7e5B45fa4eDBBA472491a9f4B166FC4'
        },
        {
          currencyCode: 'BIFI',
          currencyName: 'Beefy Finance',
          denominations: [
            {
              name: 'BIFI',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xd6070ae98b8069de6B494332d1A1a81B6179D960'
        },
        {
          currencyCode: 'BNB',
          currencyName: 'Binance',
          denominations: [
            {
              name: 'BNB',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x264c1383EA520f73dd837F915ef3a732e204a493'
        },
        {
          currencyCode: 'YAK',
          currencyName: 'Yield Yak',
          denominations: [
            {
              name: 'YAK',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7'
        },
        {
          currencyCode: 'JOE',
          currencyName: 'Joe Token',
          denominations: [
            {
              name: 'JOE',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd'
        },
        {
          currencyCode: 'FXS',
          currencyName: 'Frax Share',
          denominations: [
            {
              name: 'FXS',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x214DB107654fF987AD859F34125307783fC8e387'
        },
        {
          currencyCode: 'BUSD.e',
          currencyName: 'Binance USD',
          denominations: [
            {
              name: 'BUSD.e',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x19860CCB0A68fd4213aB9D8266F7bBf05A8dDe98'
        },
        {
          currencyCode: 'DAI.e',
          currencyName: 'Dai Stablecoin',
          denominations: [
            {
              name: 'DAI.e',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
        },
        {
          currencyCode: 'LINK.e',
          currencyName: 'ChainLink Token',
          denominations: [
            {
              name: 'LINK.e',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x5947BB275c521040051D82396192181b413227A3'
        },
        {
          currencyCode: 'UNI.e',
          currencyName: 'Uniswap',
          denominations: [
            {
              name: 'UNI.e',
              multiplier: '1000000000000000000'
            }
          ],
          contractAddress: '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580'
        },
        {
          currencyCode: 'USDC.e',
          currencyName: 'USD Coin',
          denominations: [
            {
              name: 'USDC.e',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'
        },
        {
          currencyCode: 'USDT.e',
          currencyName: 'Tether USD',
          denominations: [
            {
              name: 'USDT.e',
              multiplier: '1000000'
            }
          ],
          contractAddress: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
        },
        {
          currencyCode: 'WBTC.e',
          currencyName: 'Wrapped BTC',
          denominations: [
            {
              name: 'WBTC.e',
              multiplier: '100000000'
            }
          ],
          contractAddress: '0x50b7545627a5162F82A992c33b87aDc75187B218'
        }
      ]
    },
    allTokens: {
      '60781c2586d68229fde47564546784ab3faca982': {
        currencyCode: 'PNG',
        denominations: [
          {
            name: 'PNG',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Pangolin',
        networkLocation: {
          contractAddress: '0x60781C2586D68229fde47564546784ab3fACA982'
        }
      },
      e896cdeaac9615145c0ca09c8cd5c25bced6384c: {
        currencyCode: 'PEFI',
        denominations: [
          {
            name: 'PEFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Penguin Finance',
        networkLocation: {
          contractAddress: '0xe896CDeaAC9615145c0cA09C8Cd5C25bced6384c'
        }
      },
      d1c3f94de7e5b45fa4edbba472491a9f4b166fc4: {
        currencyCode: 'XAVA',
        denominations: [
          {
            name: 'XAVA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Avalaunch',
        networkLocation: {
          contractAddress: '0xd1c3f94DE7e5B45fa4eDBBA472491a9f4B166FC4'
        }
      },
      d6070ae98b8069de6b494332d1a1a81b6179d960: {
        currencyCode: 'BIFI',
        denominations: [
          {
            name: 'BIFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Beefy Finance',
        networkLocation: {
          contractAddress: '0xd6070ae98b8069de6B494332d1A1a81B6179D960'
        }
      },
      '264c1383ea520f73dd837f915ef3a732e204a493': {
        currencyCode: 'BNB',
        denominations: [
          {
            name: 'BNB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance',
        networkLocation: {
          contractAddress: '0x264c1383EA520f73dd837F915ef3a732e204a493'
        }
      },
      '59414b3089ce2af0010e7523dea7e2b35d776ec7': {
        currencyCode: 'YAK',
        denominations: [
          {
            name: 'YAK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yield Yak',
        networkLocation: {
          contractAddress: '0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7'
        }
      },
      '6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd': {
        currencyCode: 'JOE',
        denominations: [
          {
            name: 'JOE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Joe Token',
        networkLocation: {
          contractAddress: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd'
        }
      },
      '214db107654ff987ad859f34125307783fc8e387': {
        currencyCode: 'FXS',
        denominations: [
          {
            name: 'FXS',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Frax Share',
        networkLocation: {
          contractAddress: '0x214DB107654fF987AD859F34125307783fC8e387'
        }
      },
      '19860ccb0a68fd4213ab9d8266f7bbf05a8dde98': {
        currencyCode: 'BUSD.e',
        denominations: [
          {
            name: 'BUSD.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance USD',
        networkLocation: {
          contractAddress: '0x19860CCB0A68fd4213aB9D8266F7bBf05A8dDe98'
        }
      },
      d586e7f844cea2f87f50152665bcbc2c279d8d70: {
        currencyCode: 'DAI.e',
        denominations: [
          {
            name: 'DAI.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Dai Stablecoin',
        networkLocation: {
          contractAddress: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
        }
      },
      '5947bb275c521040051d82396192181b413227a3': {
        currencyCode: 'LINK.e',
        denominations: [
          {
            name: 'LINK.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'ChainLink Token',
        networkLocation: {
          contractAddress: '0x5947BB275c521040051D82396192181b413227A3'
        }
      },
      '8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580': {
        currencyCode: 'UNI.e',
        denominations: [
          {
            name: 'UNI.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Uniswap',
        networkLocation: {
          contractAddress: '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580'
        }
      },
      a7d7079b0fead91f3e65f86e8915cb59c1a4c664: {
        currencyCode: 'USDC.e',
        denominations: [
          {
            name: 'USDC.e',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'
        }
      },
      c7198437980c041c805a1edcba50c1ce5db95118: {
        currencyCode: 'USDT.e',
        denominations: [
          {
            name: 'USDT.e',
            multiplier: '1000000'
          }
        ],
        displayName: 'Tether USD',
        networkLocation: {
          contractAddress: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
        }
      },
      '50b7545627a5162f82a992c33b87adc75187b218': {
        currencyCode: 'WBTC.e',
        denominations: [
          {
            name: 'WBTC.e',
            multiplier: '100000000'
          }
        ],
        displayName: 'Wrapped BTC',
        networkLocation: {
          contractAddress: '0x50b7545627a5162F82A992c33b87aDc75187B218'
        }
      }
    },
    builtinTokens: {
      '60781c2586d68229fde47564546784ab3faca982': {
        currencyCode: 'PNG',
        denominations: [
          {
            name: 'PNG',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Pangolin',
        networkLocation: {
          contractAddress: '0x60781C2586D68229fde47564546784ab3fACA982'
        }
      },
      e896cdeaac9615145c0ca09c8cd5c25bced6384c: {
        currencyCode: 'PEFI',
        denominations: [
          {
            name: 'PEFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Penguin Finance',
        networkLocation: {
          contractAddress: '0xe896CDeaAC9615145c0cA09C8Cd5C25bced6384c'
        }
      },
      d1c3f94de7e5b45fa4edbba472491a9f4b166fc4: {
        currencyCode: 'XAVA',
        denominations: [
          {
            name: 'XAVA',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Avalaunch',
        networkLocation: {
          contractAddress: '0xd1c3f94DE7e5B45fa4eDBBA472491a9f4B166FC4'
        }
      },
      d6070ae98b8069de6b494332d1a1a81b6179d960: {
        currencyCode: 'BIFI',
        denominations: [
          {
            name: 'BIFI',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Beefy Finance',
        networkLocation: {
          contractAddress: '0xd6070ae98b8069de6B494332d1A1a81B6179D960'
        }
      },
      '264c1383ea520f73dd837f915ef3a732e204a493': {
        currencyCode: 'BNB',
        denominations: [
          {
            name: 'BNB',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance',
        networkLocation: {
          contractAddress: '0x264c1383EA520f73dd837F915ef3a732e204a493'
        }
      },
      '59414b3089ce2af0010e7523dea7e2b35d776ec7': {
        currencyCode: 'YAK',
        denominations: [
          {
            name: 'YAK',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Yield Yak',
        networkLocation: {
          contractAddress: '0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7'
        }
      },
      '6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd': {
        currencyCode: 'JOE',
        denominations: [
          {
            name: 'JOE',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Joe Token',
        networkLocation: {
          contractAddress: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd'
        }
      },
      '214db107654ff987ad859f34125307783fc8e387': {
        currencyCode: 'FXS',
        denominations: [
          {
            name: 'FXS',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Frax Share',
        networkLocation: {
          contractAddress: '0x214DB107654fF987AD859F34125307783fC8e387'
        }
      },
      '19860ccb0a68fd4213ab9d8266f7bbf05a8dde98': {
        currencyCode: 'BUSD.e',
        denominations: [
          {
            name: 'BUSD.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Binance USD',
        networkLocation: {
          contractAddress: '0x19860CCB0A68fd4213aB9D8266F7bBf05A8dDe98'
        }
      },
      d586e7f844cea2f87f50152665bcbc2c279d8d70: {
        currencyCode: 'DAI.e',
        denominations: [
          {
            name: 'DAI.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Dai Stablecoin',
        networkLocation: {
          contractAddress: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
        }
      },
      '5947bb275c521040051d82396192181b413227a3': {
        currencyCode: 'LINK.e',
        denominations: [
          {
            name: 'LINK.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'ChainLink Token',
        networkLocation: {
          contractAddress: '0x5947BB275c521040051D82396192181b413227A3'
        }
      },
      '8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580': {
        currencyCode: 'UNI.e',
        denominations: [
          {
            name: 'UNI.e',
            multiplier: '1000000000000000000'
          }
        ],
        displayName: 'Uniswap',
        networkLocation: {
          contractAddress: '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580'
        }
      },
      a7d7079b0fead91f3e65f86e8915cb59c1a4c664: {
        currencyCode: 'USDC.e',
        denominations: [
          {
            name: 'USDC.e',
            multiplier: '1000000'
          }
        ],
        displayName: 'USD Coin',
        networkLocation: {
          contractAddress: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'
        }
      },
      c7198437980c041c805a1edcba50c1ce5db95118: {
        currencyCode: 'USDT.e',
        denominations: [
          {
            name: 'USDT.e',
            multiplier: '1000000'
          }
        ],
        displayName: 'Tether USD',
        networkLocation: {
          contractAddress: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
        }
      },
      '50b7545627a5162f82a992c33b87adc75187b218': {
        currencyCode: 'WBTC.e',
        denominations: [
          {
            name: 'WBTC.e',
            multiplier: '100000000'
          }
        ],
        displayName: 'Wrapped BTC',
        networkLocation: {
          contractAddress: '0x50b7545627a5162F82A992c33b87aDc75187B218'
        }
      }
    },
    customTokens: {}
  },
  fio: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'FIO',
      displayName: 'FIO',
      pluginId: 'fio',
      walletType: 'wallet:fio',
      defaultSettings: {
        apiUrls: [
          'https://fio.eu.eosamsterdam.net/v1/',
          'https://fio.eosdac.io/v1/',
          'https://fio.eosrio.io/v1/',
          'https://fio.acherontrading.com/v1/',
          'https://fio.eos.barcelona/v1/',
          'https://api.fio.alohaeos.com/v1/',
          'https://fio.greymass.com/v1/',
          'https://fio.eosargentina.io/v1/',
          'https://fio.cryptolions.io/v1/',
          'https://api.fio.currencyhub.io/v1/',
          'https://fio.eosdublin.io/v1/',
          'https://fio-za.eostribe.io/v1/',
          'https://fioapi.ledgerwise.io/v1/',
          'https://api.fio.greeneosio.com/v1/',
          'https://api.fio.services/v1/',
          'https://fio.eosusa.news/v1/'
        ],
        historyNodeUrls: ['https://fio.greymass.com/v1/', 'https://fio.greymass.com/v1/', 'https://fio.eosphere.io/v1/'],
        fioRegApiUrl: 'https://reg.fioprotocol.io/public-api/',
        fioDomainRegUrl: 'https://reg.fioprotocol.io/domain/',
        fioAddressRegUrl: 'https://reg.fioprotocol.io/address/',
        fioStakingApyUrl: 'https://fioprotocol.io/staking',
        defaultRef: 'edge',
        fallbackRef: 'edge',
        freeAddressRef: 'edgefree',
        errorCodes: {
          INVALID_FIO_ADDRESS: 'INVALID_FIO_ADDRESS',
          ALREADY_REGISTERED: 'ALREADY_REGISTERED',
          FIO_ADDRESS_IS_NOT_EXIST: 'FIO_ADDRESS_IS_NOT_EXIST',
          FIO_DOMAIN_IS_NOT_EXIST: 'FIO_DOMAIN_IS_NOT_EXIST',
          FIO_DOMAIN_IS_NOT_PUBLIC: 'FIO_DOMAIN_IS_NOT_PUBLIC',
          IS_DOMAIN_PUBLIC_ERROR: 'IS_DOMAIN_PUBLIC_ERROR',
          FIO_ADDRESS_IS_NOT_LINKED: 'FIO_ADDRESS_IS_NOT_LINKED',
          SERVER_ERROR: 'SERVER_ERROR'
        },
        fioRequestsTypes: {
          PENDING: 'PENDING',
          SENT: 'SENT'
        },
        balanceCurrencyCodes: {
          staked: 'FIO:STAKED',
          locked: 'FIO:LOCKED'
        }
      },
      addressExplorer: 'https://fio.bloks.io/key/%s',
      transactionExplorer: 'https://fio.bloks.io/transaction/%s',
      denominations: [
        {
          name: 'FIO',
          multiplier: '1000000000',
          symbol: 'ᵮ'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  zcash: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'ZEC',
      displayName: 'Zcash',
      pluginId: 'zcash',
      requiredConfirmations: 10,
      walletType: 'wallet:zcash',
      defaultSettings: {
        otherSettings: {
          rpcNode: {
            networkName: 'mainnet',
            defaultHost: 'mainnet.lightwalletd.com',
            defaultPort: 9067
          },
          blockchairServers: ['https://api.blockchair.com'],
          defaultBirthday: 1310000,
          defaultNetworkFee: '1000',
          transactionQueryLimit: 999
        }
      },
      addressExplorer: 'https://blockchair.com/zcash/address/%s?from=edgeapp',
      transactionExplorer: 'https://blockchair.com/zcash/transaction/%s?from=edgeapp',
      denominations: [
        {
          name: 'ZEC',
          multiplier: '100000000',
          symbol: 'Z'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  ripple: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'XRP',
      displayName: 'XRP',
      pluginId: 'ripple',
      walletType: 'wallet:ripple',
      defaultSettings: {
        otherSettings: {
          rippledServers: ['wss://s2.ripple.com', 'wss://xrplcluster.com'],
          defaultFee: '10',
          baseReserve: '10000000'
        },
        errorCodes: {
          UNIQUE_IDENTIFIER_EXCEEDS_LENGTH: 'UNIQUE_IDENTIFIER_EXCEEDS_LENGTH',
          UNIQUE_IDENTIFIER_EXCEEDS_LIMIT: 'UNIQUE_IDENTIFIER_EXCEEDS_LIMIT',
          UNIQUE_IDENTIFIER_FORMAT: 'UNIQUE_IDENTIFIER_FORMAT'
        }
      },
      memoMaxLength: 10,
      memoMaxValue: '4294967295',
      addressExplorer: 'https://bithomp.com/explorer/%s',
      transactionExplorer: 'https://bithomp.com/explorer/%s',
      denominations: [
        {
          name: 'XRP',
          multiplier: '1000000',
          symbol: 'X'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  stellar: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'XLM',
      displayName: 'Stellar',
      pluginId: 'stellar',
      walletType: 'wallet:stellar',
      defaultSettings: {
        otherSettings: {
          stellarServers: ['https://horizon.stellar.org']
        }
      },
      memoMaxLength: 19,
      addressExplorer: 'https://stellarchain.io/address/%s',
      transactionExplorer: 'https://stellarchain.io/tx/%s',
      denominations: [
        {
          name: 'XLM',
          multiplier: '10000000',
          symbol: '*'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  tezos: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'XTZ',
      displayName: 'Tezos',
      pluginId: 'tezos',
      walletType: 'wallet:tezos',
      defaultSettings: {
        otherSettings: {
          tezosRpcNodes: ['https://rpc.tzbeta.net', 'https://mainnet.tezrpc.me'],
          tezosApiServers: ['https://api.tzkt.io']
        },
        fee: {
          transaction: '1350',
          reveal: '1300',
          burn: '257000'
        },
        limit: {
          gas: '10600',
          storage: '277'
        }
      },
      addressExplorer: 'https://tzstats.com/%s',
      transactionExplorer: 'https://tzstats.com/%s',
      denominations: [
        {
          name: 'XTZ',
          multiplier: '1000000',
          symbol: 't'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  binance: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'BNB',
      displayName: 'BNB Beacon Chain',
      pluginId: 'binance',
      walletType: 'wallet:binance',
      defaultSettings: {
        otherSettings: {
          binanceApiServers: [
            'https://dex.binance.org',
            'https://dex-atlantic.binance.org',
            'https://dex-asiapacific.binance.org',
            'https://dex-european.binance.org'
          ]
        }
      },
      memoMaxLength: 128,
      addressExplorer: 'https://explorer.binance.org/address/%s',
      transactionExplorer: 'https://explorer.binance.org/tx/%s',
      blockExplorer: 'https://explorer.binance.org/block/%s',
      denominations: [
        {
          name: 'BNB',
          multiplier: '100000000',
          symbol: 'B'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  hedera: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'HBAR',
      displayName: 'Hedera',
      pluginId: 'hedera',
      walletType: 'wallet:hedera',
      defaultSettings: {
        otherSettings: {
          creatorApiServers: ['https://creator.myhbarwallet.com'],
          mirrorNodes: ['https://mainnet-public.mirrornode.hedera.com'],
          client: 'Mainnet',
          checksumNetworkID: '0',
          maxFee: 900000
        }
      },
      memoMaxLength: 100,
      addressExplorer: 'https://explorer.kabuto.sh/mainnet/id/%s',
      transactionExplorer: 'https://explorer.kabuto.sh/mainnet/transaction/%s',
      denominations: [
        {
          name: 'HBAR',
          multiplier: '100000000',
          symbol: 'ℏ'
        },
        {
          name: 'tHBAR',
          multiplier: '1',
          symbol: 'tℏ'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  solana: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'SOL',
      displayName: 'Solana',
      pluginId: 'solana',
      walletType: 'wallet:solana',
      defaultSettings: {
        otherSettings: {
          rpcNodes: ['https://ssc-dao.genesysgo.net', 'https://api.mainnet-beta.solana.com'],
          commitment: 'confirmed',
          txQueryLimit: 1000,
          derivationPath: "m/44'/501'/0'/0'",
          memoPublicKey: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
        }
      },
      addressExplorer: 'https://blockchair.com/solana/address/%s?from=edgeapp',
      transactionExplorer: 'https://blockchair.com/solana/transaction/%s?from=edgeapp',
      denominations: [
        {
          name: 'SOL',
          multiplier: '1000000000',
          symbol: '◎'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  monero: {
    otherMethods: {},
    currencyInfo: {
      currencyCode: 'XMR',
      displayName: 'Monero',
      pluginId: 'monero',
      requiredConfirmations: 10,
      walletType: 'wallet:monero',
      defaultSettings: {
        otherSettings: {
          mymoneroApiServers: ['https://edge.mymonero.com:8443']
        }
      },
      addressExplorer: 'https://xmrchain.net/search?value=%s',
      transactionExplorer: 'https://blockchair.com/monero/transaction/%s?from=edgeapp',
      denominations: [
        {
          name: 'XMR',
          multiplier: '1000000000000',
          symbol: '‎ɱ'
        }
      ],
      metaTokens: []
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  bitcoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'bitcoin',
      walletType: 'wallet:bitcoin',
      currencyCode: 'BTC',
      displayName: 'Bitcoin',
      denominations: [
        {
          name: 'BTC',
          multiplier: '100000000',
          symbol: '₿'
        },
        {
          name: 'mBTC',
          multiplier: '100000',
          symbol: 'm₿'
        },
        {
          name: 'bits',
          multiplier: '100',
          symbol: 'ƀ'
        },
        {
          name: 'sats',
          multiplier: '1',
          symbol: 's'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://btc1.trezor.io', 'wss://btc2.trezor.io', 'wss://btc3.trezor.io', 'wss://btc4.trezor.io', 'wss://btc5.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      blockExplorer: 'https://blockchair.com/bitcoin/block/%s',
      addressExplorer: 'https://blockchair.com/bitcoin/address/%s',
      transactionExplorer: 'https://blockchair.com/bitcoin/transaction/%s',
      symbolImage: 'https://content.edge.app/bitcoin-logo-solo-64.png',
      symbolImageDarkMono: 'https://content.edge.app/bitcoin-logo-solo-64.png'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  bitcoincash: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'bitcoincash',
      walletType: 'wallet:bitcoincash',
      currencyCode: 'BCH',
      displayName: 'Bitcoin Cash',
      denominations: [
        {
          name: 'BCH',
          multiplier: '100000000',
          symbol: '₿'
        },
        {
          name: 'mBCH',
          multiplier: '100000',
          symbol: 'm₿'
        },
        {
          name: 'cash',
          multiplier: '100',
          symbol: 'ƀ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://bch1.trezor.io', 'wss://bch2.trezor.io', 'wss://bch3.trezor.io', 'wss://bch4.trezor.io', 'wss://bch5.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      blockExplorer: 'https://blockchair.com/bitcoin-cash/block/%s',
      addressExplorer: 'https://blockchair.com/bitcoin-cash/address/%s',
      transactionExplorer: 'https://blockchair.com/bitcoin-cash/transaction/%s',
      xpubExplorer: 'https://bch1.trezor.io/xpub/%s',
      symbolImage: 'https://content.edge.app/bitcoincash-logo-solo-64.png',
      symbolImageDarkMono: 'https://content.edge.app/bitcoincash-logo-solo-64.png'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  bitcoingold: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'bitcoingold',
      walletType: 'wallet:bitcoingold',
      currencyCode: 'BTG',
      displayName: 'Bitcoin Gold',
      denominations: [
        {
          name: 'BTG',
          multiplier: '100000000',
          symbol: '₿'
        },
        {
          name: 'mBTG',
          multiplier: '100000',
          symbol: 'm₿'
        },
        {
          name: 'bits',
          multiplier: '100',
          symbol: 'ƀ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://btg1.trezor.io', 'wss://btg2.trezor.io', 'wss://btg3.trezor.io', 'wss://btg4.trezor.io', 'wss://btg5.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://explorer.bitcoingold.org/insight/address/%s',
      blockExplorer: 'https://explorer.bitcoingold.org/insight/block/%s',
      transactionExplorer: 'https://explorer.bitcoingold.org/insight/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  bitcoinsv: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'bitcoinsv',
      walletType: 'wallet:bitcoinsv',
      currencyCode: 'BSV',
      displayName: 'Bitcoin SV',
      denominations: [
        {
          name: 'BSV',
          multiplier: '100000000',
          symbol: '₿'
        },
        {
          name: 'mBSV',
          multiplier: '100000',
          symbol: 'm₿'
        },
        {
          name: 'cash',
          multiplier: '100',
          symbol: 'ƀ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://bsv-bbwrap1.edge.app', 'wss://blockbook.siftbitcoin.com:9146'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      blockExplorer: 'https://whatsonchain.com/block/%s',
      addressExplorer: 'https://whatsonchain.com/address/%s',
      transactionExplorer: 'https://whatsonchain.com/tx/%s',
      symbolImage: 'https://content.edge.app/bitcoinsv-logo-solo-64.png',
      symbolImageDarkMono: 'https://content.edge.app/bitcoinsv-logo-solo-64.png'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  bitcointestnet: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'bitcointestnet',
      walletType: 'wallet:bitcointestnet',
      currencyCode: 'TESTBTC',
      displayName: 'Bitcoin Testnet',
      denominations: [
        {
          name: 'TESTBTC',
          multiplier: '100000000',
          symbol: '₿'
        },
        {
          name: 'mTESTBTC',
          multiplier: '100000',
          symbol: 'm₿'
        },
        {
          name: 'bits',
          multiplier: '100',
          symbol: 'ƀ'
        },
        {
          name: 'sats',
          multiplier: '1',
          symbol: 's'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://tbtc1.trezor.io', 'wss://tbtc2.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      blockExplorer: 'https://blockchair.com/bitcoin/testnet/block/%s',
      addressExplorer: 'https://blockchair.com/bitcoin/testnet/address/%s',
      transactionExplorer: 'https://blockchair.com/bitcoin/testnet/transaction/%s',
      symbolImage: 'https://content.edge.app/bitcoin-logo-solo-64.png',
      symbolImageDarkMono: 'https://content.edge.app/bitcoin-logo-solo-64.png'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  dash: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'dash',
      walletType: 'wallet:dash',
      currencyCode: 'DASH',
      displayName: 'Dash',
      denominations: [
        {
          name: 'DASH',
          multiplier: '100000000',
          symbol: 'Ð'
        },
        {
          name: 'mDASH',
          multiplier: '100000',
          symbol: 'mÐ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://dash1.trezor.io', 'wss://dash2.trezor.io', 'wss://dash3.trezor.io', 'wss://dash4.trezor.io', 'wss://dash5.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://blockchair.com/dash/address/%s?from=edgeapp',
      blockExplorer: 'https://blockchair.com/dash/block/%s?from=edgeapp',
      transactionExplorer: 'https://blockchair.com/dash/transaction/%s?from=edgeapp'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  digibyte: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'digibyte',
      walletType: 'wallet:digibyte',
      currencyCode: 'DGB',
      displayName: 'DigiByte',
      denominations: [
        {
          name: 'DGB',
          multiplier: '100000000',
          symbol: 'Ɗ'
        },
        {
          name: 'mDGB',
          multiplier: '100000',
          symbol: 'mƊ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://dgb1.trezor.io', 'wss://dgb2.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://digiexplorer.info/address/%s',
      blockExplorer: 'https://digiexplorer.info/block/%s',
      transactionExplorer: 'https://digiexplorer.info/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  dogecoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'dogecoin',
      walletType: 'wallet:dogecoin',
      currencyCode: 'DOGE',
      displayName: 'Dogecoin',
      denominations: [
        {
          name: 'DOGE',
          multiplier: '100000000',
          symbol: 'Ð'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://doge1.trezor.io', 'wss://doge2.trezor.io', 'wss://doge3.trezor.io', 'wss://doge4.trezor.io', 'wss://doge5.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://blockchair.com/dogecoin/address/%s?from=edgeapp',
      blockExplorer: 'https://blockchair.com/dogecoin/block/%s?from=edgeapp',
      transactionExplorer: 'https://blockchair.com/dogecoin/transaction/%s?from=edgeapp'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  eboost: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'eboost',
      walletType: 'wallet:eboost',
      currencyCode: 'EBST',
      displayName: 'eBoost',
      denominations: [
        {
          name: 'EBST',
          multiplier: '100000000',
          symbol: 'EBST'
        },
        {
          name: 'mEBST',
          multiplier: '100000',
          symbol: 'mEBST'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: [],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://www.blockexperts.com/ebst/address/%s',
      blockExplorer: 'https://www.blockexperts.com/ebst/hash/%s',
      transactionExplorer: 'https://www.blockexperts.com/ebst/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  feathercoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'feathercoin',
      walletType: 'wallet:feathercoin',
      displayName: 'Feathercoin',
      currencyCode: 'FTC',
      denominations: [
        {
          name: 'FTC',
          multiplier: '100000000',
          symbol: 'F'
        },
        {
          name: 'mFTC',
          multiplier: '100000',
          symbol: 'mF'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: [],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://fsight.chain.tips/address/%s',
      blockExplorer: 'https://fsight.chain.tips/block/%s',
      transactionExplorer: 'https://fsight.chain.tips/tx/%s',
      symbolImage: 'https://content.edge.app/feathercoin-logo-solo-64.png',
      symbolImageDarkMono: 'https://content.edge.app/feathercoin-logo-solo-64.png'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  groestlcoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'groestlcoin',
      walletType: 'wallet:groestlcoin',
      currencyCode: 'GRS',
      displayName: 'Groestlcoin',
      denominations: [
        {
          name: 'GRS',
          multiplier: '100000000',
          symbol: 'G'
        },
        {
          name: 'mGRS',
          multiplier: '100000',
          symbol: 'mG'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://blockbook.groestlcoin.org'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://blockchair.com/groestlcoin/address/%s?from=edgeapp?from=edgeapp',
      blockExplorer: 'https://blockchair.com/groestlcoin/block/%s?from=edgeapp',
      transactionExplorer: 'https://blockchair.com/groestlcoin/transaction/%s?from=edgeapp'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  litecoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'litecoin',
      walletType: 'wallet:litecoin',
      currencyCode: 'LTC',
      displayName: 'Litecoin',
      denominations: [
        {
          name: 'LTC',
          multiplier: '100000000',
          symbol: 'Ł'
        },
        {
          name: 'mLTC',
          multiplier: '100000',
          symbol: 'mŁ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://ltc1.trezor.io', 'wss://ltc2.trezor.io', 'wss://ltc3.trezor.io', 'wss://ltc4.trezor.io', 'wss://ltc5.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      blockExplorer: 'https://blockchair.com/litecoin/block/%s',
      addressExplorer: 'https://blockchair.com/litecoin/address/%s',
      transactionExplorer: 'https://blockchair.com/litecoin/transaction/%s',
      symbolImage: 'https://content.edge.app/litecoin-logo-solo-64.png',
      symbolImageDarkMono: 'https://content.edge.app/litecoin-logo-solo-64.png'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  qtum: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'qtum',
      walletType: 'wallet:qtum',
      currencyCode: 'QTUM',
      displayName: 'Qtum',
      denominations: [
        {
          name: 'QTUM',
          multiplier: '100000000',
          symbol: 'Q'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://blockbook-qtum-sfo3.edge.app'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://explorer.qtum.org/address/%s',
      blockExplorer: 'https://explorer.qtum.org/block/%s',
      transactionExplorer: 'https://explorer.qtum.org/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  ravencoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'ravencoin',
      walletType: 'wallet:ravencoin',
      currencyCode: 'RVN',
      displayName: 'Ravencoin',
      denominations: [
        {
          name: 'RVN',
          multiplier: '100000000',
          symbol: 'R'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://blockbook.ravencoin.org', 'wss://blockbook-rvn-sfo3.edge.app'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://ravencoin.network/address/%s',
      blockExplorer: 'https://ravencoin.network/block/%s',
      transactionExplorer: 'https://ravencoin.network/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  smartcash: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'smartcash',
      walletType: 'wallet:smartcash',
      currencyCode: 'SMART',
      displayName: 'SmartCash',
      denominations: [
        {
          name: 'SMART',
          multiplier: '100000000',
          symbol: 'S'
        },
        {
          name: 'mSMART',
          multiplier: '100000',
          symbol: 'mS'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: [],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://insight.smartcash.cc/address/%s',
      blockExplorer: 'https://insight.smartcash.cc/block/%s',
      transactionExplorer: 'https://insight.smartcash.cc/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  ufo: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'ufo',
      walletType: 'wallet:ufo',
      currencyCode: 'UFO',
      displayName: 'UFO',
      denominations: [
        {
          name: 'UFO',
          multiplier: '100000000',
          symbol: 'Ʉ'
        },
        {
          name: 'kUFO',
          multiplier: '100000000000',
          symbol: 'kɄ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://blockbook.ufobject.com'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://explorer.ufobject.com/address/%s',
      blockExplorer: 'https://explorer.ufobject.com/block/%s',
      transactionExplorer: 'https://explorer.ufobject.com/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  vertcoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'vertcoin',
      walletType: 'wallet:vertcoin',
      currencyCode: 'VTC',
      displayName: 'Vertcoin',
      denominations: [
        {
          name: 'VTC',
          multiplier: '100000000',
          symbol: 'V'
        },
        {
          name: 'mVTC',
          multiplier: '100000',
          symbol: 'mV'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://vtc1.trezor.io', 'wss://vtc2.trezor.io', 'wss://vtc3.trezor.io', 'wss://vtc4.trezor.io', 'wss://vtc5.trezor.io'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://insight.vertcoin.org/address/%s',
      blockExplorer: 'https://insight.vertcoin.org/block/%s',
      transactionExplorer: 'https://insight.vertcoin.org/tx/%s'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  },
  zcoin: {
    otherMethods: {},
    currencyInfo: {
      pluginId: 'zcoin',
      walletType: 'wallet:zcoin',
      displayName: 'Firo',
      currencyCode: 'FIRO',
      denominations: [
        {
          name: 'FIRO',
          multiplier: '100000000',
          symbol: 'ƒ'
        },
        {
          name: 'mFIRO',
          multiplier: '100000',
          symbol: 'mƒ'
        }
      ],
      defaultSettings: {
        customFeeSettings: ['satPerByte'],
        blockbookServers: ['wss://blockbook.firo.org'],
        enableCustomServers: false
      },
      customFeeTemplate: [
        {
          type: 'nativeAmount',
          key: 'satPerByte',
          displayName: 'Satoshis Per Byte',
          displayMultiplier: '0'
        }
      ],
      metaTokens: [],
      addressExplorer: 'https://insight.zcoin.io/address/%s',
      blockExplorer: 'https://insight.zcoin.io/block/%s',
      transactionExplorer: 'https://insight.zcoin.io/tx/%s',
      symbolImage: 'https://content.edge.app/zcoin-logo-solo-64.png',
      symbolImageDarkMono: 'https://content.edge.app/zcoin-logo-solo-64.png'
    },
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  }
}
