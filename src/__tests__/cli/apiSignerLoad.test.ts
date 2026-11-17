import { describe, expect, it, jest } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { isApiSignerNative } from '../../cli/engine/nodeApiSigner'

const ADDON = path.join(
  __dirname,
  '../../../native/edge-api-signer/node/build/Release/edge_api_signer.node'
)

/**
 * A built addon that exports the wrong thing must not be skipped in silence.
 *
 * Which signer the engine uses decides which `appKeys` layer the info server
 * serves it, so an addon the loader ignores shows up far away: a plugin
 * starting with no keys, or `No HMAC credentials available for infoRollup
 * appKeys` — a message that names the wrong cause for an operator who has
 * just built the thing.
 */
describe('isApiSignerNative', () => {
  const good = { signMessage: () => ({}), getApiKey: () => '' }

  it('accepts the addon this interface declares', () => {
    const warn = jest.fn()
    expect(isApiSignerNative(good, '/x/edge_api_signer.node', warn)).toBe(true)
    expect(warn).not.toHaveBeenCalled()
  })

  it('names the candidate and the export it lacks', () => {
    const warn = jest.fn()
    expect(
      isApiSignerNative(
        { getApiKey: () => '' },
        '/x/edge_api_signer.node',
        warn
      )
    ).toBe(false)
    expect(String(warn.mock.calls[0][0])).toContain('/x/edge_api_signer.node')
    expect(String(warn.mock.calls[0][0])).toContain('signMessage')
  })

  // Conditional, because the suite must pass on a checkout that has not
  // built the addon — which is most of them. Where it is built, the rule is
  // checked against the real thing rather than against a stub of it.
  const whenBuilt = fs.existsSync(ADDON) ? it : it.skip
  whenBuilt('accepts the real addon, which also exports getApiKey', () => {
    // `getApiKey` is the addon's own surface and nothing in this engine
    // reads it, so requiring it would reject an addon that works.
    const warn = jest.fn()
    expect(isApiSignerNative(require(ADDON), ADDON, warn)).toBe(true)
    expect(warn).not.toHaveBeenCalled()
  })

  it('refuses something that is not a module at all', () => {
    const warn = jest.fn()
    expect(isApiSignerNative(null, '/x/a.node', warn)).toBe(false)
    expect(isApiSignerNative('nonsense', '/x/a.node', warn)).toBe(false)
    expect(warn).toHaveBeenCalledTimes(2)
  })
})
