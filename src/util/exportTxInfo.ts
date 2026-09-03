import { asBoolean, asObject, asString } from 'cleaners'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

/** Per-wallet, per-asset export prefs on `wallet.disklet`. */
export const EXPORT_TX_INFO_FILE = 'exportTxInfo.json'

export const asExportTxInfo = asObject({
  bitwaveAccountId: asString,
  isExportQbo: asBoolean,
  isExportCsv: asBoolean,
  isExportBitwave: asBoolean
})

export const asExportTxInfoMap = asObject(asExportTxInfo)

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

export async function readExportTxInfoMap(
  wallet: Pick<EdgeCurrencyWallet, 'disklet'>
): Promise<ExportTxInfoMap> {
  const text = await wallet.disklet.getText(EXPORT_TX_INFO_FILE)
  return asExportTxInfoMap(JSON.parse(text))
}

export async function writeExportTxInfoMap(
  wallet: Pick<EdgeCurrencyWallet, 'disklet'>,
  map: ExportTxInfoMap
): Promise<void> {
  await wallet.disklet.setText(EXPORT_TX_INFO_FILE, JSON.stringify(map))
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
  let map: ExportTxInfoMap = {}
  try {
    map = await readExportTxInfoMap(wallet)
  } catch {
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
}
