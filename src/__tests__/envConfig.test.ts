import { describe, expect, it } from '@jest/globals'

import { asEnvConfig } from '../envConfig'

describe('asEnvConfig EVM api keys', () => {
  it('supplies the deprecated etherscanApiKey from evmScanApiKey', () => {
    // edge-currency-accountbased reads only `etherscanApiKey` for
    // api.etherscan.io, and a keyless Etherscan V2 request is rejected, which
    // leaves EVM wallets stuck at 50% sync:
    const env = asEnvConfig({ ETHEREUM_INIT: { evmScanApiKey: ['key1'] } })
    expect(env.ETHEREUM_INIT).toMatchObject({
      evmScanApiKey: ['key1'],
      etherscanApiKey: ['key1']
    })
  })

  it('leaves an explicit etherscanApiKey alone', () => {
    const env = asEnvConfig({
      ETHEREUM_INIT: { evmScanApiKey: ['key1'], etherscanApiKey: ['legacy'] }
    })
    expect(env.ETHEREUM_INIT).toMatchObject({
      evmScanApiKey: ['key1'],
      etherscanApiKey: ['legacy']
    })
  })

  it('adds no key when evmScanApiKey is unconfigured', () => {
    const env = asEnvConfig({ ETHEREUM_INIT: {} })
    expect(env.ETHEREUM_INIT).toMatchObject({
      evmScanApiKey: [],
      etherscanApiKey: undefined
    })
  })

  it('applies to every EVM plugin init, not just ethereum', () => {
    const env = asEnvConfig({ BASE_INIT: { evmScanApiKey: ['key1'] } })
    expect(env.BASE_INIT).toMatchObject({ etherscanApiKey: ['key1'] })
  })

  it('keeps a disabled plugin init disabled', () => {
    const env = asEnvConfig({ ETHEREUM_INIT: false })
    expect(env.ETHEREUM_INIT).toBe(false)
  })
})
