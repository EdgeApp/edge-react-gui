import { describe, expect, test } from '@jest/globals'

import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { isMoneroEdgeLws } from '../util/monero'

describe('isMoneroEdgeLws', () => {
  test('Edge LWS when custom servers are disabled', () => {
    expect(
      isMoneroEdgeLws({
        enableCustomServers: false,
        enableCustomMonerod: false,
        moneroLightwalletServer: '',
        monerodServer: ''
      })
    ).toBe(true)
  })

  test('Edge LWS when the custom server points at an Edge host', () => {
    expect(
      isMoneroEdgeLws({
        enableCustomServers: true,
        enableCustomMonerod: false,
        moneroLightwalletServer: 'https://monerolws1.edge.app',
        monerodServer: ''
      })
    ).toBe(true)
  })

  test('custom LWS when the custom server points elsewhere', () => {
    expect(
      isMoneroEdgeLws({
        enableCustomServers: true,
        enableCustomMonerod: false,
        moneroLightwalletServer: 'https://my.node.example.com',
        monerodServer: ''
      })
    ).toBe(false)
  })
})

describe('monero checkImportedWalletSettings', () => {
  const check = SPECIAL_CURRENCY_INFO.monero.checkImportedWalletSettings
  if (check == null)
    throw new Error('monero checkImportedWalletSettings missing')

  test('overrides lws -> monerod when using Edge LWS (default settings)', () => {
    const result = check(
      { backend: 'lws' },
      { enableCustomServers: false, moneroLightwalletServer: '' }
    )
    expect(result?.settings.backend).toBe('monerod')
    expect(result?.warning).toBeTruthy()
  })

  test('allows lws when using a custom (non-Edge) LWS server', () => {
    const result = check(
      { backend: 'lws' },
      {
        enableCustomServers: true,
        moneroLightwalletServer: 'https://my.node.example.com'
      }
    )
    expect(result).toBeUndefined()
  })

  test('overrides lws -> monerod when the custom server is an Edge LWS host', () => {
    const result = check(
      { backend: 'lws' },
      {
        enableCustomServers: true,
        moneroLightwalletServer: 'https://monerolws2.edge.app'
      }
    )
    expect(result?.settings.backend).toBe('monerod')
  })

  test('no override when the backend is already monerod', () => {
    const result = check(
      { backend: 'monerod' },
      { enableCustomServers: false, moneroLightwalletServer: '' }
    )
    expect(result).toBeUndefined()
  })

  test('treats an unset backend as needing the override under Edge LWS', () => {
    const result = check(
      {},
      { enableCustomServers: false, moneroLightwalletServer: '' }
    )
    expect(result?.settings.backend).toBe('monerod')
  })

  test('overrides lws -> monerod for an account with empty user settings', () => {
    // A never-configured account stores `{}`; it resolves to Edge LWS, so an
    // imported lws wallet must still be pushed to the full node.
    const result = check({ backend: 'lws' }, {})
    expect(result?.settings.backend).toBe('monerod')
    expect(result?.warning).toBeTruthy()
  })
})
