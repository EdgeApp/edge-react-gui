import { describe, it } from '@jest/globals'

import {
  CryptoKey,
  FiatProviderAssetMapQuery,
  PaymentKey,
  ProviderSupportObject,
  ProviderSupportStore,
  queryNodes
} from '../../plugins/gui/providers/ProviderSupportStore'

describe('ProviderSupportStore', () => {
  const generalStore = makeGeneralStoreFixture()

  it('toJsonObject, toJson, fromJsonObject, fromJson', () => {
    const obj = generalStore.toJsonObject()
    const json = generalStore.toJson()

    const expectedObj = {
      buy: true,
      '*': {
        US: true,
        'US:CA': true,
        UK: true,
        '*': {
          'iso:USD': true,
          'iso:CAD': true,
          'iso:GBP': true,
          '*': {
            ach: true,
            sepa: true,
            credit: true,
            '*': {
              'ethereum:null': true,
              'ethereum:USDC': true,
              'bitcoin:null': true
            }
          }
        }
      }
    }
    expect(obj).toEqual(expectedObj)

    const expectedJson = JSON.stringify(expectedObj)
    expect(json).toBe(expectedJson)

    generalStore.fromJsonObject(obj)
    expect(generalStore.toJsonObject()).toEqual(expectedObj)

    generalStore.fromJson(json)
    expect(generalStore.toJson()).toEqual(expectedJson)
  })

  it('toJsonObject', () => {
    const obj = generalStore.toJsonObject()

    expect(obj).toEqual({
      buy: true,
      '*': {
        US: true,
        'US:CA': true,
        UK: true,
        '*': {
          'iso:USD': true,
          'iso:CAD': true,
          'iso:GBP': true,
          '*': {
            ach: true,
            sepa: true,
            credit: true,
            '*': {
              'ethereum:null': true,
              'ethereum:USDC': true,
              'bitcoin:null': true
            }
          }
        }
      }
    })
  })

  it('isSupported -> true', () => {
    expect(generalStore.is.direction('buy').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('iso:USD').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('iso:USD').payment('ach').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('iso:USD').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('iso:USD').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('iso:USD').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('iso:USD').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('*').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('*').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('*').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('*').payment('ach').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('iso:USD').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('iso:USD').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('iso:USD').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('iso:USD').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('*').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('*').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('*').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('*').payment('*').crypto('ethereum:null').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('iso:USD').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('iso:USD').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('iso:USD').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('iso:USD').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('*').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('*').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('*').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('*').payment('ach').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('iso:USD').payment('*').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('iso:USD').payment('*').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('iso:USD').payment('*').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('iso:USD').payment('*').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('US').fiat('*').payment('*').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('US').fiat('*').payment('*').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('buy').region('*').fiat('*').payment('*').crypto('*').supported).toBe(true)
    expect(generalStore.is.direction('*').region('*').fiat('*').payment('*').crypto('*').supported).toBe(true)
  })

  it('isSupported -> false', () => {
    expect(generalStore.is.direction('sell').supported).toBe(false)
    expect(generalStore.is.direction('sell').region('US').supported).toBe(false)
    expect(generalStore.is.direction('sell').region('US').fiat('iso:USD').supported).toBe(false)
    expect(generalStore.is.direction('sell').region('US').fiat('iso:USD').payment('ach').supported).toBe(false)
    expect(generalStore.is.direction('sell').region('US').fiat('iso:USD').payment('ach').crypto('ethereum:null').supported).toBe(false)
    expect(generalStore.is.direction('*').region('IT').fiat('iso:USD').payment('ach').crypto('ethereum:null').supported).toBe(false)
    expect(generalStore.is.direction('buy').region('*').fiat('iso:JPY').payment('ach').crypto('ethereum:null').supported).toBe(false)
    expect(generalStore.is.direction('buy').region('*').fiat('iso:JPY').payment('ach').supported).toBe(false)
    expect(generalStore.is.direction('buy').region('*').fiat('iso:JPY').supported).toBe(false)
    expect(generalStore.is.direction('*').region('*').fiat('*').payment('*').crypto('monero').supported).toBe(false)
  })

  it('special matching rules', () => {
    const store = new ProviderSupportStore('test')

    // all rule with explicit regions
    store.add.direction('buy').region('US:CA')
    store.add.direction('buy').region('US:FL')
    store.add.direction('buy').region('US:*').fiat('iso:USD')
    // any rule (implied)
    store.add.direction('buy').region('UK').fiat('iso:GBP')
    // any rule with explicit any region
    store.add.direction('buy').region('CA:').fiat('iso:CAD')

    // all rule -> true
    expect(store.is.direction('buy').region('US:CA').fiat('iso:USD').supported).toBe(true)
    expect(store.is.direction('buy').region('US:FL').fiat('iso:USD').supported).toBe(true)
    expect(store.is.direction('buy').region('*').fiat('iso:USD').supported).toBe(true)
    // all rule -> false
    expect(store.is.direction('buy').region('US:TX').fiat('iso:USD').supported).toBe(false)
    expect(store.is.direction('buy').region('US').fiat('iso:USD').supported).toBe(false)

    // any rule -> true
    expect(store.is.direction('buy').region('UK').fiat('iso:GBP').supported).toBe(true)
    expect(store.is.direction('buy').region('UK:JQ').fiat('iso:GBP').supported).toBe(true)
    expect(store.is.direction('buy').region('CA').fiat('iso:CAD').supported).toBe(true)
    expect(store.is.direction('buy').region('CA:QC').fiat('iso:CAD').supported).toBe(true)
    // any rule -> false
    expect(store.is.direction('buy').region('UK').fiat('iso:USD').supported).toBe(false)
    expect(store.is.direction('buy').region('UK:JQ').fiat('iso:USD').supported).toBe(false)
    expect(store.is.direction('buy').region('CA:QC').fiat('iso:USD').supported).toBe(false)
    expect(store.is.direction('buy').region('CA').fiat('iso:USD').supported).toBe(false)

    // match-all queries:
    expect(store.is.direction('buy').region('*').fiat('iso:CAD').supported).toBe(true)
    expect(store.is.direction('buy').region('*').fiat('iso:CAD').supported).toBe(true)
    expect(store.is.direction('buy').region('*').fiat('iso:CAD').supported).toBe(true)
    expect(store.is.direction('buy').region('UK').fiat('*').supported).toBe(true)
    expect(store.is.direction('*').region('UK').fiat('iso:GBP').supported).toBe(true)
    expect(store.is.direction('*').region('UK').fiat('iso:USD').supported).toBe(false)
  })

  it('queries across branches', () => {
    const store = makeBityStoreFixture()

    expect(store.toJsonObject()).toEqual({
      '*': {
        AT: true,
        BE: true,
        BG: true,
        CH: true,
        CZ: true,
        DK: true,
        EE: true,
        FI: true,
        FR: true,
        DE: true,
        GR: true,
        HU: true,
        IE: true,
        IT: true,
        LV: true,
        LT: true,
        LU: true,
        NL: true,
        PL: true,
        PT: true,
        RO: true,
        SK: true,
        SI: true,
        ES: true,
        SE: true,
        HR: true,
        LI: true,
        NO: true,
        SM: true,
        GB: true,
        '*': {
          '*': {
            sepa: {
              'bitcoin:null': true,
              'ethereum:null': true,
              'ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': true,
              'ethereum:dac17f958d2ee523a2206206994597c13d831ec7': true
            }
          }
        }
      },
      sell: {
        '*': {
          'iso:CHF': {
            sepa: true
          },
          'iso:EUR': {
            sepa: true
          }
        }
      }
    })

    expect(store.is.direction('*').region('IT').fiat('iso:CHF').supported).toBe(true)
    expect(store.is.direction('*').region('FR').fiat('iso:CHF').supported).toBe(true)
    expect(store.is.direction('*').region('FR').fiat('iso:EUR').supported).toBe(true)
    expect(store.is.direction('*').region('FR').fiat('iso:EUR').payment('sepa').supported).toBe(true)
    expect(store.is.direction('*').region('FR').fiat('iso:EUR').payment('sepa').crypto('ethereum:null').supported).toBe(true)

    expect(store.is.direction('*').region('US').fiat('iso:EUR').payment('sepa').crypto('ethereum:null').supported).toBe(false)
    expect(store.is.direction('*').region('US').fiat('iso:EUR').payment('sepa').supported).toBe(false)
    expect(store.is.direction('*').region('US').fiat('iso:EUR').supported).toBe(false)
    expect(store.is.direction('*').region('US').supported).toBe(false)
    expect(store.is.direction('buy').region('FR').fiat('iso:EUR').payment('sepa').crypto('ethereum:null').supported).toBe(false)
    expect(store.is.direction('buy').region('FR').fiat('iso:EUR').payment('sepa').supported).toBe(false)
    expect(store.is.direction('buy').region('FR').fiat('iso:EUR').supported).toBe(false)
    expect(store.is.direction('buy').region('FR').supported).toBe(false)
    expect(store.is.direction('buy').supported).toBe(false)
    expect(store.is.direction('*').region('*').fiat('iso:USD').payment('sepa').crypto('ethereum:null').supported).toBe(false)
    expect(store.is.direction('*').region('*').fiat('iso:USD').payment('sepa').supported).toBe(false)
    expect(store.is.direction('*').region('*').fiat('iso:USD').supported).toBe(false)
    expect(store.is.direction('*').region('*').supported).toBe(true)
    expect(store.is.direction('*').supported).toBe(true)
  })

  describe('getFiatProviderAssetMap', () => {
    type Tester = (params: FiatProviderAssetMapQuery) => { crypto: string[]; fiat: string[] }

    function makeTestCase(fixture: ProviderSupportObject): Tester {
      // Setup fixtures:
      const store = new ProviderSupportStore('test')
      store.fromJsonObject(fixture)

      // Make tester function:
      const tester: Tester = params => {
        const result = store.getFiatProviderAssetMap(params)
        const crypto: string[] = Object.keys(result.crypto).flatMap(pluginId => {
          return result.crypto[pluginId].map(token => `${pluginId}:${token.tokenId}`)
        })
        const fiat: string[] = Object.keys(result.fiat)
        return { crypto, fiat }
      }

      // Return tester function:
      return tester
    }

    const test = makeTestCase({
      // direction
      sell: {
        // region
        IT: true,
        '*': {
          // fiat
          'iso:EUR': true,
          'iso:CHF': true,
          '*': {
            // payment
            sepa: {
              // crypto
              'ethereum:null': true,
              'ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': true,
              'ethereum:dac17f958d2ee523a2206206994597c13d831ec7': true,
              'bitcoin:null': true
            }
          }
        }
      },
      // Negative test data (this data shouldn't appear in test results):
      buy: {
        IT: true,
        US: {
          'iso:USD': {
            sepa: {
              'ethereum:null': true,
              'ethereum:USDC': true,
              'bitcoin:null': true
            }
          }
        },
        '*': {
          'iso:USD': {
            ach: {
              'ethereum:null': true,
              'ethereum:USDC': true,
              'bitcoin:null': true
            }
          }
        }
      }
    })

    it('will match query-all with match-all node', () => {
      const store = new ProviderSupportStore('test')
      store.fromJsonObject({
        buy: true,
        sell: true,
        '*': {
          '*': { '*': { sepa: true } }
        }
      })

      expect(store.is.direction('*').region('*').fiat('*').payment('sepa').supported).toBe(true)
    })

    it('will return crypto and fiat for a given query', () => {
      expect(test({ direction: 'sell', region: 'IT', payment: 'sepa' })).toStrictEqual({
        crypto: ['ethereum:null', 'ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'ethereum:dac17f958d2ee523a2206206994597c13d831ec7', 'bitcoin:null'],
        fiat: ['iso:EUR', 'iso:CHF']
      })
    })

    it('will return empty results for wrong direction', () => {
      expect(test({ direction: 'buy', region: 'IT', payment: 'sepa' })).toStrictEqual({
        crypto: [],
        fiat: []
      })
    })

    it('will return empty results for wrong region', () => {
      expect(test({ direction: 'sell', region: 'US', payment: 'sepa' })).toStrictEqual({
        crypto: [],
        fiat: []
      })
    })

    it('will return empty results for wrong payment', () => {
      expect(test({ direction: 'sell', region: 'IT', payment: 'ach' })).toStrictEqual({
        crypto: [],
        fiat: []
      })
    })
  })

  describe('queryNodes', () => {
    type InternalTree = Map<string, InternalTree>
    interface InternalTreeRecord {
      [key: string]: InternalTreeRecord
    }

    // Convert objects to maps for testing convenience
    const toMap = (obj: InternalTreeRecord): InternalTree => {
      const map = new Map()
      for (const key in obj) {
        map.set(key, toMap(obj[key]))
      }
      return map
    }
    const allToMap = (arr: InternalTreeRecord[]): InternalTree[] => arr.map(toMap)

    const foodTree: InternalTree = toMap({
      'fruit:apple': {
        horse: {}
      },
      'fruit:banana': {
        ape: {}
      },
      'veggie:carrot': {
        bunny: {},
        horse: {}
      },
      '': {
        blender: {}
      },
      '*': {
        human: {}
      }
    })

    it('will return all nodes for match-all query', () => {
      const result = queryNodes([foodTree], '*')
      expect(result).toStrictEqual(
        allToMap([
          // fruit:apple
          {
            horse: {}
          },
          // fruit:banana
          {
            ape: {}
          },
          // veggie:carrot
          {
            bunny: {},
            horse: {}
          },
          // match-any
          {
            blender: {}
          },
          // match-all
          {
            human: {}
          }
        ])
      )
    })

    it('will return exact node', () => {
      const result = queryNodes([foodTree], 'veggie:carrot')
      expect(result).toStrictEqual(
        allToMap([
          // veggie:carrot
          {
            bunny: {},
            horse: {}
          },
          // match-any
          {
            blender: {}
          },
          // match-all
          {
            human: {}
          }
        ])
      )
    })

    it('will always return match-any node', () => {
      const result = queryNodes([foodTree], 'frog')
      expect(result).toStrictEqual(
        allToMap([
          // match-any
          {
            blender: {}
          }
        ])
      )
    })

    it('will return sub-group node', () => {
      const result = queryNodes([foodTree], 'fruit:*')
      expect(result).toStrictEqual(
        allToMap([
          // fruit:apple
          {
            horse: {}
          },
          // fruit:banana
          {
            ape: {}
          },
          // match-any
          {
            blender: {}
          },
          // match-all
          {
            human: {}
          }
        ])
      )
    })
  })
})

function makeGeneralStoreFixture(): ProviderSupportStore {
  const store = new ProviderSupportStore('test')

  const directions = ['buy'] as const
  const regions = ['US', 'US:CA', 'UK'] as const
  const fiats = ['iso:USD', 'iso:CAD', 'iso:GBP'] as const
  const payments: PaymentKey[] = ['ach', 'sepa', 'credit']
  const cryptos: CryptoKey[] = ['ethereum:null', 'ethereum:USDC', 'bitcoin:null']
  directions.forEach(direction => {
    store.add.direction(direction)
  })
  regions.forEach(region => {
    store.add.direction('*').region(region)
  })
  fiats.forEach(fiat => {
    store.add.direction('*').region('*').fiat(fiat)
  })
  payments.forEach(payment => {
    store.add.direction('*').region('*').fiat('*').payment(payment)
  })
  cryptos.forEach(crypto => {
    store.add.direction('*').region('*').fiat('*').payment('*').crypto(crypto)
  })

  return store
}

function makeBityStoreFixture(): ProviderSupportStore {
  const store = new ProviderSupportStore('bity')

  const regions = [
    'AT',
    'BE',
    'BG',
    'CH',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
    'HR',
    'LI',
    'NO',
    'SM',
    'GB'
  ]

  // Add regions
  regions.forEach(region => store.add.direction('*').region(region))

  // Add fiats and payment methods
  store.add.direction('sell').region('*').fiat('iso:CHF').payment('sepa')
  store.add.direction('sell').region('*').fiat('iso:EUR').payment('sepa')

  // Add crypto assets
  store.add.direction('*').region('*').fiat('*').payment('sepa').crypto('bitcoin:null')
  store.add.direction('*').region('*').fiat('*').payment('sepa').crypto('ethereum:null')
  store.add.direction('*').region('*').fiat('*').payment('sepa').crypto('ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
  store.add.direction('*').region('*').fiat('*').payment('sepa').crypto('ethereum:dac17f958d2ee523a2206206994597c13d831ec7')

  return store
}
