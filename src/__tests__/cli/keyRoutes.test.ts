import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import { displayKey } from '../../cli/engine/routes/keys'
import { makeFakeWalletAccount } from '../../util/fake/fakeDisklet'

const account = (loaded: string[]): EdgeAccount =>
  makeFakeWalletAccount({ allKeys: loaded })

/**
 * A display key the plugin cannot produce is not an engine fault.
 *
 * Core asks the currency tools for the display form and, for a plugin whose
 * tools do not implement it, falls back to `waitForCurrencyEngine` — which
 * needs a running engine, and core builds those from `activeWalletIds`. On an
 * archived wallet that threw a plain `Error` reading `Wallet id … does not
 * exist in this account`, which this engine reported as `500
 * INTERNAL_ERROR`: a knowable condition, on a route whose own resolver had
 * just found the wallet in `allKeys`, answering a caller who is usually
 * recovering keys.
 */
describe('displayKey', () => {
  it('returns the key the plugin produced', async () => {
    expect(
      await displayKey(account(['w1']), 'w1', async () => 'seed words here')
    ).toStrictEqual({ key: 'seed words here' })
  })

  it('says the wallet is not running when it is not loaded', async () => {
    const failed = displayKey(account([]), 'w1', async () => {
      throw new Error('Wallet id w1 does not exist in this account')
    })
    await expect(failed).rejects.toMatchObject({
      code: 'WALLET_NOT_RUNNING',
      status: 409
    })
    // And says what to do instead, because the raw routes do work.
    await expect(failed).rejects.toThrow(/get-raw-private-key/)
  })

  it('carries the plugin’s own message into the substitution', async () => {
    // The guard narrows which arm this is, not what went wrong inside it.
    // The substitution happens before the request sink, so a dropped cause
    // was gone from `engine-<profile>.log` as well as from the response — on
    // the routes a caller reaches when they are already in trouble.
    await expect(
      displayKey(account([]), 'w1', async () => {
        throw new Error('Wallet id w1 does not exist in this account')
      })
    ).rejects.toThrow(/The plugin said: Wallet id w1 does not exist/)
  })

  it('does not rewrite a failure from a wallet that is running', async () => {
    // A plugin that threw for its own reasons is still a fault, and
    // relabelling it would hide the only description of what went wrong.
    const failed = displayKey(account(['w1']), 'w1', async () => {
      throw new Error('the plugin exploded')
    })
    await expect(failed).rejects.toThrow('the plugin exploded')
  })

  it('answers while archived for a plugin whose tools implement it', async () => {
    // The reason this cannot be a pre-check on `currencyWallets`: core only
    // needs an engine where the tools do not provide the display form.
    expect(
      await displayKey(account([]), 'w1', async () => 'from the tools')
    ).toStrictEqual({ key: 'from the tools' })
  })
})
