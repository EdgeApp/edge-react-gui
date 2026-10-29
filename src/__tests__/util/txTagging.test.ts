import { describe, expect, it, jest } from '@jest/globals'
import type {
  EdgeCurrencyWallet,
  EdgeSaveTxMetadataOptions,
  EdgeTransaction
} from 'edge-core-js'

import {
  hasPersistableTxMetadata,
  saveTxAndMetadata
} from '../../util/txTagging'

function makeWallet(opts?: { saveTxMetadataError?: Error }): {
  wallet: EdgeCurrencyWallet
  saveTx: jest.Mock<() => Promise<void>>
  saveTxMetadata: jest.Mock<(opts: EdgeSaveTxMetadataOptions) => Promise<void>>
} {
  const saveTx = jest.fn<() => Promise<void>>(async () => {})
  const saveTxMetadata = jest.fn<
    (opts: EdgeSaveTxMetadataOptions) => Promise<void>
  >(async () => {
    if (opts?.saveTxMetadataError != null) throw opts.saveTxMetadataError
  })
  return {
    wallet: { saveTx, saveTxMetadata } as unknown as EdgeCurrencyWallet,
    saveTx,
    saveTxMetadata
  }
}

const tx = (metadata?: EdgeTransaction['metadata']): EdgeTransaction =>
  ({ txid: 'abc', tokenId: null, metadata } as unknown as EdgeTransaction)

describe('hasPersistableTxMetadata', () => {
  it('is false for nothing worth re-applying', () => {
    expect(hasPersistableTxMetadata(undefined)).toBe(false)
    expect(hasPersistableTxMetadata({})).toBe(false)
    expect(
      hasPersistableTxMetadata({ name: '', notes: '', category: '' })
    ).toBe(false)
  })

  it('is true for any one supplied field, including a category', () => {
    expect(hasPersistableTxMetadata({ name: 'Alice' })).toBe(true)
    expect(hasPersistableTxMetadata({ notes: 'rent' })).toBe(true)
    expect(hasPersistableTxMetadata({ category: 'Expense:Food' })).toBe(true)
  })
})

describe('saveTxAndMetadata', () => {
  it('saves the transaction and nothing else when there is no metadata', async () => {
    const { wallet, saveTx, saveTxMetadata } = makeWallet()
    await saveTxAndMetadata(wallet, tx())
    expect(saveTx).toHaveBeenCalledTimes(1)
    expect(saveTxMetadata).not.toHaveBeenCalled()
  })

  it('re-applies only the fields the caller supplied', async () => {
    const { wallet, saveTxMetadata } = makeWallet()
    await saveTxAndMetadata(wallet, tx({ notes: 'rent' }))

    // An empty string would *clear* the field core derived, so absent fields
    // must be absent from the change object rather than ''.
    expect(saveTxMetadata).toHaveBeenCalledWith({
      txid: 'abc',
      tokenId: null,
      metadata: { notes: 'rent' }
    })
  })

  it('does not clear a sibling field that was passed empty', async () => {
    const { wallet, saveTxMetadata } = makeWallet()
    await saveTxAndMetadata(wallet, tx({ notes: 'rent', name: '' }))

    const [{ metadata }] = saveTxMetadata.mock.calls[0]
    expect(metadata).toEqual({ notes: 'rent' })
    expect('name' in metadata).toBe(false)
  })

  it('carries all three when all three are supplied', async () => {
    const { wallet, saveTxMetadata } = makeWallet()
    await saveTxAndMetadata(
      wallet,
      tx({ name: 'Alice', notes: 'rent', category: 'Expense:Rent' })
    )
    const [{ metadata }] = saveTxMetadata.mock.calls[0]
    expect(metadata).toEqual({
      name: 'Alice',
      notes: 'rent',
      category: 'Expense:Rent'
    })
  })

  it('routes a metadata failure to onMetadataError instead of throwing', async () => {
    const failure = new Error('sync failed')
    const { wallet } = makeWallet({ saveTxMetadataError: failure })
    const onMetadataError = jest.fn<(error: unknown) => void>()

    await saveTxAndMetadata(wallet, tx({ name: 'Alice' }), { onMetadataError })
    expect(onMetadataError).toHaveBeenCalledWith(failure)
  })

  it('throws a metadata failure when no handler is given', async () => {
    const failure = new Error('sync failed')
    const { wallet } = makeWallet({ saveTxMetadataError: failure })
    await expect(saveTxAndMetadata(wallet, tx({ name: 'Alice' }))).rejects.toBe(
      failure
    )
  })

  it('never reports a failed broadcast as success', async () => {
    const { wallet, saveTx, saveTxMetadata } = makeWallet()
    saveTx.mockRejectedValue(new Error('disk full') as never)
    await expect(
      saveTxAndMetadata(wallet, tx({ name: 'Alice' }))
    ).rejects.toThrow('disk full')
    expect(saveTxMetadata).not.toHaveBeenCalled()
  })
})
