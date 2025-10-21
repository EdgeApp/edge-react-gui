import type { EdgeMetadata } from 'edge-core-js/types'

// TODO: HACK: Will remove asap in Tomb Finance V3.

export interface MetadataCacheEntry {
  currencyCode: string
  metadata: EdgeMetadata
}

export const stakeMetadataCache = new Map<string, MetadataCacheEntry[]>()

export const cacheTxMetadata = (
  txid: string,
  currencyCode: string,
  metadata: EdgeMetadata
) => {
  // Add metadata cache entry:
  const key = txid.toLowerCase()
  const cacheEntries = stakeMetadataCache.get(key)
  if (cacheEntries == null) {
    stakeMetadataCache.set(key, [{ currencyCode, metadata }])
  } else {
    cacheEntries.push({ currencyCode, metadata })
  }
}
