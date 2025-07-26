import type { EdgeMetadata } from 'edge-core-js/types'

// TODO: HACK: Will remove asap in Tomb Finance V3.

export interface MetadataCacheEntry {
  currencyCode: string
  metadata: EdgeMetadata
}

export type MetadataCache = Record<string, MetadataCacheEntry[]>

export const stakeMetadataCache: MetadataCache = {}

export const cacheTxMetadata = (
  txid: string,
  currencyCode: string,
  metadata: EdgeMetadata
) => {
  // Add metadata cache entry:
  const key = txid.toLowerCase()
  stakeMetadataCache[key] = stakeMetadataCache[key] ?? []
  stakeMetadataCache[key].push({ currencyCode, metadata })
}
