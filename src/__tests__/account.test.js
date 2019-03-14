// @flow
/* globals describe expect it */

import { type EdgeAccount, type EdgeContext, type EdgeFakeWorld, addEdgeCorePlugins, lockEdgeCorePlugins, makeFakeEdgeWorld } from 'edge-core-js'
import accountbased from 'edge-currency-accountbased'
import monero from 'edge-currency-monero'
import bitcoin from 'edge-currency-bitcoin'
import exchange from 'edge-exchange-plugins'
import { currencyPlugins } from '../components/core/EdgeCoreManager.js'
import { fakeUser } from '../fake-user.js'

// TODO: The core will do this work itself in a future version:
addEdgeCorePlugins(bitcoin)
addEdgeCorePlugins(monero)
addEdgeCorePlugins(accountbased)
addEdgeCorePlugins(exchange)
lockEdgeCorePlugins()

// Enable or disable plugins in this list:
/*const currencyPlugins = {
  eos: true,
  ethereum: true,
  ripple: true,
  stellar: true
}*/

const contextOptions = { apiKey: '', appId: '', currencyPlugins }

describe('Account', () => {
  it('has a username', async () => {
    const world: EdgeFakeWorld = await makeFakeEdgeWorld([fakeUser])
    const context: EdgeContext = await world.makeEdgeContext(contextOptions)
    const account: EdgeAccount = await context.loginWithPIN(fakeUser.username, fakeUser.pin)
    const names = Object.getOwnPropertyNames(account)
    console.log('account is: ', names)
    console.log('account.username: ', account.currencyConfig['bitcoin'].currencyInfo)
    expect(account.username).toBe('js test 1')
  })
})
