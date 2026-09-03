import type {
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeMetadataChange,
  EdgeTransaction
} from 'edge-core-js'

/** A field the caller actually supplied, rather than an empty placeholder. */
function nonEmpty(value: string | undefined): boolean {
  return value != null && value !== ''
}

/**
 * True when the caller supplied metadata worth re-applying — a payee name
 * from BIP21 or a resolved address, notes, or an explicit category.
 *
 * A category counts. Callers must therefore pass the metadata they were given,
 * not the display metadata computed for a transaction, whose `Expense:` /
 * `Income:` category would make every send look like it carried one.
 */
export function hasPersistableTxMetadata(
  metadata: EdgeMetadata | undefined
): boolean {
  if (metadata == null) return false
  return (
    nonEmpty(metadata.name) ||
    nonEmpty(metadata.notes) ||
    nonEmpty(metadata.category)
  )
}

/**
 * saveTx plus the saveTxMetadata re-apply used by SendScene2 and the CLI.
 *
 * Core derives its own metadata for a sent transaction, and a concurrent
 * engine callback can land after ours and drop what the caller asked for. So
 * the fields the caller actually supplied are written again afterwards.
 *
 * Only non-empty fields are sent. Under `EdgeMetadataChange` an empty string
 * is a value, not "leave unchanged" — only `undefined` means that, and `null`
 * deletes — so sending all three verbatim let a caller who supplied one field
 * erase the other two.
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

  const change: EdgeMetadataChange = {}
  if (nonEmpty(metadata?.name)) change.name = metadata?.name
  if (nonEmpty(metadata?.notes)) change.notes = metadata?.notes
  if (nonEmpty(metadata?.category)) change.category = metadata?.category

  try {
    await wallet.saveTxMetadata({
      txid: tx.txid,
      tokenId: tx.tokenId,
      metadata: change
    })
  } catch (error: unknown) {
    if (opts?.onMetadataError != null) {
      opts.onMetadataError(error)
      return
    }
    throw error
  }
}
