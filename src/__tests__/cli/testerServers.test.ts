import { describe, expect, it } from '@jest/globals'

import { isTesterConfig, TESTER_SERVERS } from '../../cli/engine/testerServers'

/**
 * The one check between the live-server harness and production.
 *
 * `scripts/testCli.ts` asks the engine for its config and refuses to continue
 * unless this answers true. Whatever it accepts is what that harness logs
 * into with a funded account, spends from and deletes wallets on.
 */
describe('isTesterConfig', () => {
  it('accepts the tester fleet', () => {
    expect(isTesterConfig(TESTER_SERVERS)).toBe(true)
    expect(
      isTesterConfig({ loginServer: 'https://login-tester.edge.app' })
    ).toBe(true)
    // `sync-tester-us1`: the label carries the fleet and a suffix.
    expect(
      isTesterConfig({ syncServer: 'https://sync-tester-us1.edge.app' })
    ).toBe(true)
  })

  it('refuses production', () => {
    expect(isTesterConfig({ loginServer: 'https://login.edge.app' })).toBe(
      false
    )
    expect(
      isTesterConfig({
        loginServer: 'https://login-tester.edge.app',
        infoServer: 'https://info.edge.app'
      })
    ).toBe(false)
  })

  it('refuses a production host with the word in its path or query', () => {
    // The substring test over the whole URL read all three of these as the
    // tester fleet.
    for (const url of [
      'https://login.edge.app/?x=-tester',
      'https://login.edge.app/tester-',
      'https://login.edge.app#sync-tester-us1.edge.app'
    ]) {
      expect(isTesterConfig({ loginServer: url })).toBe(false)
    }
  })

  it('refuses a host that only ends in the word', () => {
    // `notatester.edge.app` has no separator before `tester`, so it is not a
    // member of the fleet.
    expect(isTesterConfig({ loginServer: 'https://notatester.edge.app' })).toBe(
      false
    )
  })

  it('refuses a value that is not a URL, and an empty config', () => {
    expect(isTesterConfig({ loginServer: 'login-tester' })).toBe(false)
    // No server named at all means core's production defaults.
    expect(isTesterConfig({})).toBe(false)
  })
})
