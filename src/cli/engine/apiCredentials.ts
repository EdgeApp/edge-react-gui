/**
 * Which key and which signer every request is made with.
 *
 * Four decisions used to live inline in `makeCoreContext`, behind
 * `if (opts.fake === true) return` and a `loadKeysFrom()` call — so jest
 * never reached them (both offline suites are `--fake`) and the only thing
 * that drove the real path was `scripts/testNodeApiSigner.ts`, wired to
 * `test:cli:node-hmac`, which appears in neither `.travis.yml` nor
 * `precommit` nor `precommit:cli` and needs the built addon plus tester
 * network besides.
 *
 * What was unguarded is not plumbing. Which signer is chosen decides which
 * `appKeys` layer the info server serves, so a regression here surfaces as a
 * plugin starting with no keys — the failure this engine is hardest to trace
 * back. Pure, so the combinations are a table.
 *
 * Node-safe: no react-native, no core, no I/O.
 */
import { base16 } from 'rfc4648'

interface ApiCredentialsInput {
  /** `-k`, or `EDGE_CLI_API_KEY` by way of it. An override. */
  apiKey?: string
  /** `apiKey` from the config file. Where the key came from, not an override. */
  configApiKey?: string
}

interface ApiCredentialsEnv {
  /** Whether the N-API HMAC signer addon is present. */
  hasSigner: boolean
  /** `EDGE_CLI_FORCE_KEYS_JSON=1`. */
  forceKeysJson: boolean
}

interface ApiCredentials {
  effectiveApiKey: string
  /** The `keys.json` secret, parsed, or undefined when it does not apply. */
  apiSecret?: Uint8Array
  useNativeSigner: boolean
  /**
   * Why the native signer was not used, when it was not.
   *
   * The engine logs the two apart: an operator who has built the addon and
   * is still being served the floor `appKeys` layer has to be able to tell
   * "I asked for keys.json" from "the addon could not be loaded".
   */
  forceKeysJson: boolean
}

export class ApiCredentialsError extends Error {}

export function resolveApiCredentials(
  opts: ApiCredentialsInput,
  keys: { edgeApiKey: string; edgeApiSecret?: string },
  env: ApiCredentialsEnv
): ApiCredentials {
  // Order: an explicit `-k`, then the config file, then keys.json. Only the
  // first is an override.
  const effectiveApiKey = opts.apiKey ?? opts.configApiKey ?? keys.edgeApiKey
  // The secret in `keys.json` and the secret the native addon was built
  // with both belong to `keys.edgeApiKey`, so neither is usable once the
  // effective key is a different one: signing key B with A's secret fails
  // the `infoRollup` fetch, and `makeCoreContext` swallows that into a
  // single warn line, so every plugin quietly boots on the floor `appKeys`
  // layer. The test is which key is in use, not how it got there — an
  // explicit `-k` was the only case this checked, and a config-file
  // `apiKey` that differs from `keys.json` produced exactly the mismatched
  // pair the check exists to prevent. A config key that *equals* it keeps
  // both, because then the pair is intact: treating any config key as an
  // override is what used to turn off HMAC signing for anyone who wrote
  // their own key into `edge-cli.conf`.
  const keyOwnsKeysJsonSecret = effectiveApiKey === keys.edgeApiKey
  const apiSecretHex = keyOwnsKeysJsonSecret
    ? keys.edgeApiSecret ?? undefined
    : undefined
  // Explicit -k / EDGE_CLI_FORCE_KEYS_JSON skips the N-API signer so
  // operators can point a native-built engine at alternate keys for
  // tester/debug. A key the addon's secret does not belong to skips it for
  // the same reason, and with no `keys.json` secret to fall back to the
  // engine then runs unsigned rather than wrongly signed.
  const forceKeysJson =
    opts.apiKey != null || !keyOwnsKeysJsonSecret || env.forceKeysJson
  const useNativeSigner = !forceKeysJson && env.hasSigner

  let apiSecret: Uint8Array | undefined
  if (apiSecretHex != null) {
    // Named, because `base16.parse` throws its own `Error: Invalid base16
    // character` with no mention of the file or the field: a hand-edited
    // `keys.json` with a typo in the secret failed the engine's start with a
    // message that read like a bug in the CLI.
    try {
      apiSecret = base16.parse(apiSecretHex.replace(/^0x/i, '').toUpperCase())
    } catch {
      throw new ApiCredentialsError(
        'edgeApiSecret in keys.json is not hexadecimal'
      )
    }
  }

  return { effectiveApiKey, apiSecret, useNativeSigner, forceKeysJson }
}
