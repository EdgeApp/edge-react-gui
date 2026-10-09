/**
 * Run async operations one at a time per key.
 *
 * The engine serves requests concurrently, so a read-modify-write over a
 * whole shared file — a wallet's `exportTxInfo.json`, an account's
 * `Settings.json` — can interleave with another and the second write
 * silently discards the first. Disklet has no compare-and-swap, so the
 * serialization has to live here.
 *
 * A failed operation does not poison the queue behind it, and a key is
 * dropped once nothing is waiting on it, so the map stays bounded.
 */
const chains = new Map<string, Promise<void>>()

export async function serializeByKey<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve()
  const run = previous.then(operation)
  const tail = run.then(
    () => {},
    () => {}
  )
  chains.set(key, tail)
  try {
    return await run
  } finally {
    // Only the last operation in the chain clears the key; an earlier one
    // finishing must not drop a queue that is still being appended to.
    if (chains.get(key) === tail) chains.delete(key)
  }
}

/** How many keys currently have work queued. Tests read this. */
export function pendingKeyCount(): number {
  return chains.size
}
