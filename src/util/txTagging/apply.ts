/**
 * Save a transaction, then re-apply the caller's metadata.
 *
 * `wallet.saveTx` writes a caller's metadata only for a transaction it has
 * not saved before, so the CLI's `spend` and `save-tx` follow it with a
 * `saveTxMetadata` whose failure must not undo the save. That sequence and the test for whether there is
 * anything worth saving are here rather than in either caller.
 *
 * Not the metadata *edit* path: `save-tx-metadata` and the GUI's details
 * scene call `wallet.saveTxMetadata` directly, with no `saveTx` to follow.
 *
 * Node-safe, like everything the CLI shares: no react-native, no Redux, no
 * Airship.
 */
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
 * saveTx plus the saveTxMetadata re-apply used by the CLI's `spend` and
 * `save-tx`.
 *
 * Saving a transaction core has already saved changes nothing, so the
 * caller's metadata would not reach it. The fields the caller actually
 * supplied are written again afterwards.
 *
 * Only non-empty fields are sent. Under `EdgeMetadataChange` an empty string
 * is a value, not "leave unchanged" — only `undefined` means that, and `null`
 * deletes — so sending all three verbatim would let a caller who supplied one
 * field erase the other two.
 *
 * saveTx errors always throw. saveTxMetadata errors throw unless
 * `onMetadataError` is provided (both CLI callers use that so a tagging
 * failure cannot look like a failed send after broadcast).
 *
 * This fires for a category or a note, not only for a payee name, because
 * metadata that core drops loses *every* field, not just the name, and a
 * category arriving from a payment URI would otherwise be lost with it. The
 * cost is one extra round trip on a send that carries a category but no
 * payee, which buys back a field that could otherwise vanish on reload.
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
