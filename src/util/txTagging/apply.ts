import type {
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeTransaction
} from 'edge-core-js'

/**
 * True when we actually know a payee or notes (BIP21, resolved name, or
 * explicit body). Do not treat computed Expense/Income as persistable.
 */
export function hasPersistableTxMetadata(
  metadata: EdgeMetadata | undefined
): boolean {
  if (metadata == null) return false
  return (
    (metadata.name != null && metadata.name !== '') ||
    (metadata.notes != null && metadata.notes !== '') ||
    (metadata.category != null && metadata.category !== '')
  )
}

/**
 * saveTx plus the saveTxMetadata race workaround from SendScene2.
 * Re-applies name/notes/category when those fields are non-empty so a
 * concurrent engine callback cannot drop them.
 */
export async function saveTxAndMetadata(
  wallet: EdgeCurrencyWallet,
  tx: EdgeTransaction
): Promise<void> {
  await wallet.saveTx(tx)
  const metadata = tx.metadata
  if (!hasPersistableTxMetadata(metadata)) return
  await wallet.saveTxMetadata({
    txid: tx.txid,
    tokenId: tx.tokenId,
    metadata: {
      name: metadata?.name,
      notes: metadata?.notes,
      category: metadata?.category
    }
  })
}
