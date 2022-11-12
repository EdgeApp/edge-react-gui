import { EdgeMetadata } from 'edge-core-js/types'

// TODO: HACK: Will remove asap in Tomb Finance V3.

export interface MetadataCacheEntry {
  currencyCode: string
  metadata: EdgeMetadata
  nativeAmount?: string // multiple tokens and amounts can be in each tx
}

export interface MetadataCache {
  [txid: string]: MetadataCacheEntry[]
}

export const stakeMetadataCache: MetadataCache = {}

export const cacheTxMetadata = (txid: string, currencyCode: string, metadata: EdgeMetadata, nativeAmount?: string) => {
  // Add metadata cache entry:
  const key = txid.toLowerCase()
  stakeMetadataCache[key] = stakeMetadataCache[key] ?? []
  stakeMetadataCache[key].push({ currencyCode, metadata, nativeAmount })
}
