import { describe, expect, it } from '@jest/globals'
import { base16 } from 'rfc4648'

import {
  ApiCredentialsError,
  resolveApiCredentials
} from '../../cli/engine/apiCredentials'

/**
 * The four decisions that choose what every request is signed with.
 *
 * They were inline in `makeCoreContext`, which measured 21.62% of statements
 * with `154-512` uncovered: jest never passes `if (opts.fake === true)
 * return`, because both offline suites are `--fake`, and the only thing that
 * drove the real path was `scripts/testNodeApiSigner.ts` — wired to
 * `test:cli:node-hmac`, which appears in neither `.travis.yml`, nor
 * `precommit`, nor `precommit:cli`, and needs the built addon plus tester
 * network besides. `apiSignerLoad.test.ts` covers only
 * `isApiSignerNative`, the addon's shape validator.
 *
 * What that left unguarded is not plumbing. Which signer is chosen decides
 * which `appKeys` layer the info server serves, so a regression here
 * surfaces as a plugin starting with no keys — the failure this engine is
 * hardest to trace back.
 */
const SECRET = 'a1b2c3'
const keys = { edgeApiKey: 'from-keys-json', edgeApiSecret: SECRET }

describe('resolveApiCredentials', () => {
  it('takes the key from keys.json when nothing overrides it', () => {
    const out = resolveApiCredentials({}, keys, {
      hasSigner: false,
      forceKeysJson: false
    })
    expect(out.effectiveApiKey).toBe('from-keys-json')
    expect(out.apiSecret).toStrictEqual(base16.parse(SECRET.toUpperCase()))
    expect(out.useNativeSigner).toBe(false)
    expect(out.forceKeysJson).toBe(false)
  })

  it('lets -k replace the key and drop the keys.json secret', () => {
    // The secret belongs to the key it was written beside. Pairing them
    // would sign every request with a mismatched secret.
    const out = resolveApiCredentials({ apiKey: 'explicit' }, keys, {
      hasSigner: true,
      forceKeysJson: false
    })
    expect(out.effectiveApiKey).toBe('explicit')
    expect(out.apiSecret).toBeUndefined()
    // And it skips the addon, so an operator can point a native-built engine
    // at alternate keys.
    expect(out.useNativeSigner).toBe(false)
    expect(out.forceKeysJson).toBe(true)
  })

  it('keeps the secret and the signer for a config-file key that matches', () => {
    // A config-file `apiKey` is where the key came from, not an override.
    // Treating it like `-k` silently turned off HMAC signing for anyone who
    // wrote `apiKey` into `edge-cli.conf`, which is the opposite of what
    // `docs/EDGE_CLI.md` promises. It names the same key here, so the pair
    // is intact.
    const out = resolveApiCredentials(
      { configApiKey: 'from-keys-json' },
      keys,
      { hasSigner: true, forceKeysJson: false }
    )
    expect(out.effectiveApiKey).toBe('from-keys-json')
    expect(out.apiSecret).toStrictEqual(base16.parse(SECRET.toUpperCase()))
    expect(out.useNativeSigner).toBe(true)
    expect(out.forceKeysJson).toBe(false)
  })

  it('drops the secret and the signer for a config-file key that differs', () => {
    // The pair belongs to `keys.edgeApiKey`. A config file naming a
    // different key used to keep both, so every request went out as key B
    // signed with A's secret: the signed `infoRollup` fetch fails,
    // `makeCoreContext` swallows it into one warn line, and every plugin
    // boots on the floor `appKeys` layer — the failure this engine is
    // hardest to trace back. Unsigned is the honest answer.
    const out = resolveApiCredentials({ configApiKey: 'from-conf' }, keys, {
      hasSigner: true,
      forceKeysJson: false
    })
    expect(out.effectiveApiKey).toBe('from-conf')
    expect(out.apiSecret).toBeUndefined()
    expect(out.useNativeSigner).toBe(false)
    expect(out.forceKeysJson).toBe(true)
  })

  it('prefers -k over a config-file key', () => {
    const out = resolveApiCredentials(
      { apiKey: 'explicit', configApiKey: 'from-conf' },
      keys,
      { hasSigner: false, forceKeysJson: false }
    )
    expect(out.effectiveApiKey).toBe('explicit')
  })

  it('uses the native signer when the addon is there', () => {
    const out = resolveApiCredentials({}, keys, {
      hasSigner: true,
      forceKeysJson: false
    })
    expect(out.useNativeSigner).toBe(true)
    expect(out.forceKeysJson).toBe(false)
  })

  it('obeys EDGE_CLI_FORCE_KEYS_JSON with the addon present', () => {
    const out = resolveApiCredentials({}, keys, {
      hasSigner: true,
      forceKeysJson: true
    })
    expect(out.useNativeSigner).toBe(false)
    expect(out.forceKeysJson).toBe(true)
    // The secret is still the keys.json one: this flag asks for that pair,
    // it does not replace the key.
    expect(out.apiSecret).toStrictEqual(base16.parse(SECRET.toUpperCase()))
    expect(out.effectiveApiKey).toBe('from-keys-json')
  })

  it('answers an empty key when there is nothing at all', () => {
    // The caller turns this into the throw that is the first thing every
    // command does on an `npm install -g` CLI: no addon and no keys.json.
    const out = resolveApiCredentials(
      {},
      { edgeApiKey: '', edgeApiSecret: undefined },
      { hasSigner: false, forceKeysJson: false }
    )
    expect(out.effectiveApiKey).toBe('')
    expect(out.apiSecret).toBeUndefined()
    expect(out.useNativeSigner).toBe(false)
  })

  it('accepts an 0x-prefixed secret in either case', () => {
    const upper = resolveApiCredentials(
      {},
      { edgeApiKey: 'k', edgeApiSecret: '0xA1B2C3' },
      { hasSigner: false, forceKeysJson: false }
    )
    expect(upper.apiSecret).toStrictEqual(base16.parse('A1B2C3'))
  })

  it('names the file and the field for a secret that is not hex', () => {
    // `base16.parse` throws `Invalid base16 character` with no mention of
    // either, so a hand-edited `keys.json` with a typo failed the engine's
    // start with a message that read like a bug in the CLI.
    let message = ''
    try {
      resolveApiCredentials(
        {},
        { edgeApiKey: 'k', edgeApiSecret: 'not hex!' },
        { hasSigner: false, forceKeysJson: false }
      )
    } catch (error) {
      if (!(error instanceof ApiCredentialsError)) throw error
      message = error.message
    }
    expect(message).toContain('keys.json')
    expect(message).toContain('edgeApiSecret')
  })
})
