// @flow
/* globals describe expect it */

import { type EdgeAccount, type EdgeContext, type EdgeFakeWorld, addEdgeCorePlugins, lockEdgeCorePlugins, makeFakeEdgeWorld } from 'edge-core-js'
import accountbased from 'edge-currency-accountbased'
import bitcoin from 'edge-currency-bitcoin'
import monero from 'edge-currency-monero'
import exchange from 'edge-exchange-plugins'

import { currencyPlugins } from '../util/corePlugins.js'
import { fakeUser } from '../util/fake-user.js'

// TODO: The core will do this work itself in a future version:
addEdgeCorePlugins(bitcoin)
addEdgeCorePlugins(monero)
addEdgeCorePlugins(accountbased)
addEdgeCorePlugins(exchange)
lockEdgeCorePlugins()

const contextOptions = { apiKey: '', appId: '', plugins: currencyPlugins }
describe.skip('Account', () => {
  it('has denominations that match the app default denomination settings', async () => {
    const world: EdgeFakeWorld = await makeFakeEdgeWorld([fakeUser])
    const context: EdgeContext = await world.makeEdgeContext(contextOptions)
    const account: EdgeAccount = await context.loginWithPIN(fakeUser.username, fakeUser.pin)
    expect(account.username).toBe('js test 1')
  })
})
