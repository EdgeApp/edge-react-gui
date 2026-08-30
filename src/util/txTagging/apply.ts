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
 * saveTx plus the saveTxMetadata race workaround used by SendScene2 and
 * the CLI. Re-applies name/notes/category when those fields are non-empty
 * so a concurrent engine callback cannot drop them.
 *
 * saveTx errors always throw. saveTxMetadata errors throw unless
 * `onMetadataError` is provided (the GUI uses that so a tagging failure
 * cannot look like a failed send after broadcast).
 */
export async function saveTxAndMetadata(
  wallet: EdgeCurrencyWallet,
  tx: EdgeTransaction,
  opts?: {
    onMetadataError?: (error: unknown) => void
  }
): Promise<void> {
  await wallet.saveTx(tx)
  const metadata = tx.metadata
  if (!hasPersistableTxMetadata(metadata)) return
  try {
    await wallet.saveTxMetadata({
      txid: tx.txid,
      tokenId: tx.tokenId,
      metadata: {
        name: metadata?.name,
        notes: metadata?.notes,
        category: metadata?.category
      }
    })
  } catch (error: unknown) {
    if (opts?.onMetadataError != null) {
      opts.onMetadataError(error)
      return
    }
    throw error
  }
}
