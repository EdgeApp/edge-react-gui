import {
  asBoolean,
  asJSON,
  asMaybe,
  asObject,
  asString,
  uncleaner
} from 'cleaners'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { isMissingFile } from './predicates'
import { serializeByKey } from './serializeByKey'

/** Per-wallet, per-asset export prefs on `wallet.disklet`. */
export const EXPORT_TX_INFO_FILE = 'exportTxInfo.json'

export const asExportTxInfo = asObject({
  bitwaveAccountId: asString,
  isExportQbo: asBoolean,
  isExportCsv: asBoolean,
  isExportBitwave: asBoolean
})

export const asExportTxInfoMap = asObject(asExportTxInfo)

const uncleanExportTxInfoMap = uncleaner(asExportTxInfoMap)

export type ExportTxInfo = ReturnType<typeof asExportTxInfo>
export type ExportTxInfoMap = ReturnType<typeof asExportTxInfoMap>

/**
 * Map key is `tokenId ?? currencyCode` (native = currency code; token =
 * contract tokenId). Matches the GUI export scene.
 */
export function exportTxInfoKey(
  wallet: Pick<EdgeCurrencyWallet, 'currencyInfo'>,
  tokenId: EdgeTokenId
): string {
  return tokenId ?? wallet.currencyInfo.currencyCode
}

/** Tolerant of a record this version cannot read; strict about the rest. */
const asStoredExportTxInfoMap = asJSON(asObject(asMaybe(asExportTxInfo)))

export async function readExportTxInfoMap(
  wallet: Pick<EdgeCurrencyWallet, 'disklet'>
): Promise<ExportTxInfoMap> {
  const text = await wallet.disklet.getText(EXPORT_TX_INFO_FILE)
  // `asJSON`, so one cleaner owns both the parse and the shape — and
  // `asMaybe` per record, so one unreadable asset entry costs that entry
  // rather than the Export button. A whole file that will not parse is also
  // tolerated, because nothing can be recovered from it and the GUI scene
  // recovered by writing a fresh map; a genuine read or decryption failure
  // still throws, out of `getText`, and the caller decides.
  const map = asMaybe(asStoredExportTxInfoMap)(text) ?? {}
  const out: ExportTxInfoMap = {}
  for (const [key, value] of Object.entries(map)) {
    if (value != null) out[key] = value
  }
  return out
}

async function writeExportTxInfoMap(
  wallet: Pick<EdgeCurrencyWallet, 'disklet'>,
  map: ExportTxInfoMap
): Promise<void> {
  // Through the cleaner's uncleaner: a shape change is then a compile
  // error rather than a file `readExportTxInfoMap` later rejects.
  await wallet.disklet.setText(
    EXPORT_TX_INFO_FILE,
    JSON.stringify(uncleanExportTxInfoMap(map))
  )
}

/**
 * Merge one asset key. Omitted patch fields keep the previous value, or
 * `false` / `''` when creating the key.
 */
export async function mergeExportTxInfo(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId,
  patch: Partial<ExportTxInfo>
): Promise<ExportTxInfo> {
  // Read-modify-write over the whole file, so two calls for different tokens
  // on the same wallet must not interleave: the engine serves requests
  // concurrently and the second write would discard the first.
  return await serializeByKey(`exportTxInfo:${wallet.id}`, async () => {
    let map: ExportTxInfoMap
    try {
      map = await readExportTxInfoMap(wallet)
    } catch (error: unknown) {
      // Only an absent file may be answered with an empty map. A bad shape
      // never reaches here — `readExportTxInfoMap` drops the records it
      // cannot read — so anything caught here is a real I/O or decryption
      // failure, and answering *that* with a rewrite would turn one
      // unreadable file into the loss of every asset's saved preferences.
      if (!isMissingFile(error)) throw error
      map = {}
    }
    const key = exportTxInfoKey(wallet, tokenId)
    const prev = map[key]
    const next: ExportTxInfo = {
      bitwaveAccountId: patch.bitwaveAccountId ?? prev?.bitwaveAccountId ?? '',
      isExportBitwave: patch.isExportBitwave ?? prev?.isExportBitwave ?? false,
      isExportCsv: patch.isExportCsv ?? prev?.isExportCsv ?? false,
      isExportQbo: patch.isExportQbo ?? prev?.isExportQbo ?? false
    }
    map[key] = next
    await writeExportTxInfoMap(wallet, map)
    return next
  })
}
