import { describe, expect, it } from '@jest/globals'

import { isUtxoPluginId } from '../../constants/WalletAndCurrencyConstants'
import { currencyPlugins, utxoPlugins } from '../../util/corePlugins'

describe('corePlugins', () => {
  it('keeps every UTXO plugin in the UTXO table', () => {
    // `isUtxoPluginId` derives from this table, which gates UTXO-only UI such
    // as the large-wallet slow-sync card:
    expect(Object.keys(utxoPlugins).sort()).toEqual([
      'bitcoin',
      'bitcoincash',
      'bitcoincashtestnet',
      'bitcoingold',
      'bitcoingoldtestnet',
      'bitcoinsv',
      'bitcointestnet',
      'bitcointestnet4',
      'dash',
      'digibyte',
      'dogecoin',
      'eboost',
      'ecash',
      'feathercoin',
      'groestlcoin',
      'litecoin',
      'pivx',
      'qtum',
      'ravencoin',
      'smartcash',
      'ufo',
      'vertcoin',
      'zcoin'
    ])
  })

  it('treats eCash as a UTXO plugin', () => {
    expect(isUtxoPluginId('ecash')).toBe(true)
  })

  it('still registers every UTXO plugin as a currency plugin', () => {
    expect(Object.keys(currencyPlugins)).toEqual(
      expect.arrayContaining(Object.keys(utxoPlugins))
    )
  })
})
