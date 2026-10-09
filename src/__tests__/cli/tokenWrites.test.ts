import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { changeEnabledTokenIds } from '../../cli/engine/routes/tokens'

/**
 * The write that replaces a wallet's enabled assets on every device.
 *
 * `wallet.changeEnabledTokenIds` takes the *complete desired set*, so a
 * wrong list is not a partial failure: it is the user's enabled assets
 * replaced, in the account's synced wallet file, everywhere they are logged
 * in. The client's `--add`/`--remove` sugar reads the current set and posts
 * the whole list back, which is how `new Set(undefined)` once turned
 * `--add X` into "X and nothing else".
 *
 * Nothing drove the successful write. In the offline suites the fake world's
 * wallet is UTXO and has no tokens, so the only reachable arms are the
 * refusals and a no-op; QA could not drive it on a real account either,
 * because no wallet that account loads has a token-capable plugin. A
 * recording stub is what is left, and what it pins is the set that reaches
 * core — which is the whole of the destructive behaviour.
 */
function makeCtx(
  body: Record<string, unknown>,
  opts: { allTokens?: Record<string, unknown>; enabled?: string[] } = {}
): { ctx: any; sent: string[][] } {
  const sent: string[][] = []
  let enabled = opts.enabled ?? []
  const wallet = {
    id: 'wallet-1',
    currencyInfo: { pluginId: 'ethereum', currencyCode: 'ETH' },
    currencyConfig: {
      allTokens: opts.allTokens ?? {
        tok1: { currencyCode: 'USDC' },
        tok2: { currencyCode: 'DAI' }
      }
    },
    get enabledTokenIds() {
      return enabled
    },
    async changeEnabledTokenIds(tokenIds: string[]) {
      sent.push(tokenIds)
      enabled = tokenIds
    }
  } as unknown as EdgeCurrencyWallet
  const account = {
    currencyWallets: { 'wallet-1': wallet }
  } as unknown as EdgeAccount
  return {
    sent,
    ctx: {
      params: { sessionId: 'session-1' },
      body,
      state: {
        logger: { info: () => {}, warn: () => {}, error: () => {} },
        sessions: { get: () => ({ account }) }
      }
    }
  }
}

describe('change-enabled-token-ids', () => {
  it('sends the complete set as given, and answers what core then holds', async () => {
    const { ctx, sent } = makeCtx({
      walletId: 'wallet-1',
      tokenIds: ['tok1', 'tok2']
    })
    const result: any = await changeEnabledTokenIds.handler(ctx)
    expect(sent).toStrictEqual([['tok1', 'tok2']])
    // Read back off the wallet, not echoed from the request: core filters
    // the set it was handed, and the response is what it kept.
    expect(result.enabledTokenIds).toStrictEqual(['tok1', 'tok2'])
  })

  it('sends the empty set, which is how a wallet is cleared', async () => {
    // What `--disable-all` produces. The absolute setter has no other way to
    // say "disable everything", and this is the arm with the largest blast
    // radius, so it is the one worth pinning.
    const { ctx, sent } = makeCtx(
      { walletId: 'wallet-1', tokenIds: [] },
      { enabled: ['tok1'] }
    )
    const result: any = await changeEnabledTokenIds.handler(ctx)
    expect(sent).toStrictEqual([[]])
    expect(result.enabledTokenIds).toStrictEqual([])
  })

  it('writes nothing when one id is unknown', async () => {
    // Core ends `changeEnabledTokenIds` with
    // `.filter(tokenId => allTokens[tokenId] != null)`, so it drops what it
    // does not know and answers 200 — a mistyped contract address arriving
    // inside a known-good set was indistinguishable from success. The whole
    // call is refused, before anything is written.
    const { ctx, sent } = makeCtx({
      walletId: 'wallet-1',
      tokenIds: ['tok1', 'deadbeef']
    })
    await expect(changeEnabledTokenIds.handler(ctx)).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND'
    })
    expect(sent).toStrictEqual([])
  })

  it('writes nothing when an id is null', async () => {
    // `asRequestTokenId` admits `null` because most routes read it as the
    // chain's own coin. That is always enabled and core would drop it, so
    // it is a refusal rather than a silently shortened set.
    const { ctx, sent } = makeCtx({
      walletId: 'wallet-1',
      tokenIds: ['tok1', null]
    })
    await expect(changeEnabledTokenIds.handler(ctx)).rejects.toMatchObject({
      code: 'BAD_REQUEST'
    })
    expect(sent).toStrictEqual([])
  })

  it('refuses the whole call for a wallet with no tokens at all', async () => {
    // A UTXO wallet, which is every wallet the offline suites have: its
    // `allTokens` is empty, so any id is unknown. The empty set is still
    // accepted, because it asks for nothing.
    const { ctx, sent } = makeCtx(
      { walletId: 'wallet-1', tokenIds: ['tok1'] },
      { allTokens: {} }
    )
    await expect(changeEnabledTokenIds.handler(ctx)).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND'
    })
    expect(sent).toStrictEqual([])
  })
})
