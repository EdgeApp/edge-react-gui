import { resolveWalletType } from '../cli/engine/resolve'

describe('resolveWalletType', () => {
  const account = {
    currencyConfig: {
      bitcoin: {
        currencyInfo: {
          walletType: 'wallet:bitcoin'
        }
      }
    }
  }

  it('resolves a plugin id to its wallet type', () => {
    expect(resolveWalletType(account, 'bitcoin')).toBe('wallet:bitcoin')
  })

  it('preserves an existing wallet type', () => {
    expect(resolveWalletType(account, 'wallet:bitcoin')).toBe('wallet:bitcoin')
  })

  it('preserves unknown inputs for Edge Core to validate', () => {
    expect(resolveWalletType(account, 'unknown-plugin')).toBe('unknown-plugin')
  })
})
