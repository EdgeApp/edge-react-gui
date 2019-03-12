// @flow
/* globals describe expect it */

import { type EdgeAccount, type EdgeContext, type EdgeFakeWorld, addEdgeCorePlugins, lockEdgeCorePlugins, makeFakeEdgeWorld } from 'edge-core-js'
import accountbased from 'edge-currency-accountbased'

import { fakeUser } from '../fake-user.js'

// TODO: The core will do this work itself in a future version:
addEdgeCorePlugins(accountbased)
lockEdgeCorePlugins()

// Enable or disable plugins in this list:
const plugins = {
  eos: true,
  ethereum: true,
  ripple: true,
  stellar: true
}
const contextOptions = { apiKey: '', appId: '', plugins }

describe('Account', () => {
  it('has a username', async () => {
    const world: EdgeFakeWorld = await makeFakeEdgeWorld([fakeUser])
    const context: EdgeContext = await world.makeEdgeContext(contextOptions)
    const account: EdgeAccount = await context.loginWithPIN(fakeUser.username, fakeUser.pin)

    expect(account.username).toBe('js test 1')
  })
})
