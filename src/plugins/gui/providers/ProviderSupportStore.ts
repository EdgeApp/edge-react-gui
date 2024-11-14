import { asEither, asJSON, asString, asValue, uncleaner } from 'cleaners'
import { EdgeTokenId } from 'edge-core-js'

import { asObjectIn, asObjectInOrTrue } from '../../../util/cleaners'
import { asFiatPaymentType, FiatPaymentType } from '../fiatPluginTypes'
import { FiatProviderAssetMap } from '../fiatProviderTypes'

// '*' means 'all'; apply to all specified keys
// '' means 'any'; apply to all keys (even ones not specified)
export type SpecialQualifier = '*' | ''

export type DirectionKey = 'buy' | 'sell' | SpecialQualifier
export type RegionKey = string // "US" | "US:CA" | "UK" | "US:*" | "*" | ""
export type FiatKey = string // "USD" | "GBP" | "*" | ""
export type PaymentKey = FiatPaymentType | SpecialQualifier
export type CryptoKey = string // "bitcoin:null" | "ethereum:null" | "ethereum:<token-id>"

// The internal in-memory data structure representing the support-tree
// for each provider
type InternalTree = Map<string, InternalTree>
// The tree storing "other info" for each crypto currency
type CryptoAssetInfoTree = Map<CryptoKey, unknown>
// The tree storing "other info" for each fiat currency
type FiatAssetInfoTree = Map<FiatKey, unknown>

// The JSON-serializable object structure for the provider support tree
export type ProviderSupportObject = {
  [direction in DirectionKey]?:
    | true
    | {
        [region in RegionKey]?:
          | true
          | {
              [fiat in FiatKey]?:
                | true
                | {
                    [payment in PaymentKey]?:
                      | true
                      | {
                          [crypto in CryptoKey]?: true
                        }
                  }
            }
      }
}

// Cleaner for serializing/deserializing the provider support object:
const asSpecialQualifier = asValue('*', '')
const asDirectionKeyPartial = asValue('buy', 'sell') // Necessary to satisfy type inference
const asDirectionKey = asEither(asDirectionKeyPartial, asSpecialQualifier)
const asRegionKey = asString
const asFiatKey = asString
const asPaymentKey = asEither(asFiatPaymentType, asSpecialQualifier)
const asCryptoKey = asString
const asProviderSupportObject = asJSON<ProviderSupportObject>(
  asObjectIn(
    asDirectionKey,
    asObjectInOrTrue(asRegionKey, asObjectInOrTrue(asFiatKey, asObjectInOrTrue(asPaymentKey, asObjectInOrTrue(asCryptoKey, asValue(true)))))
  )
)
const wasProviderSupportObject = uncleaner(asProviderSupportObject)

interface ProviderSupportAddApi {
  direction: (key: DirectionKey) => {
    region: (key: RegionKey) => {
      fiat: (key: FiatKey) => {
        payment: (key: PaymentKey) => {
          crypto: (key: CryptoKey) => void
        }
      }
    }
  }
}

interface ProviderSupportQueryApi {
  direction: (key: DirectionKey) => {
    supported: boolean
    region: (key: RegionKey) => {
      supported: boolean
      fiat: (key: FiatKey) => {
        supported: boolean
        payment: (key: PaymentKey) => {
          supported: boolean
          crypto: (key: CryptoKey) => {
            supported: boolean
          }
        }
      }
    }
  }
}

export interface FiatProviderAssetMapQuery {
  direction: DirectionKey
  region: RegionKey
  payment: PaymentKey
}

export class ProviderSupportStore {
  readonly providerId: string
  readonly add: ProviderSupportAddApi
  readonly is: ProviderSupportQueryApi

  private readonly supportTree: InternalTree = new Map()
  private readonly cryptoAssetInfo: CryptoAssetInfoTree = new Map()
  private readonly fiatAssetInfo: FiatAssetInfoTree = new Map()

  constructor(providerId: string) {
    this.providerId = providerId
    this.add = makeAddApi(this.supportTree, ['direction', 'region', 'fiat', 'payment', 'crypto']) as any
    this.is = makeQueryApi([this.supportTree], ['direction', 'region', 'fiat', 'payment', 'crypto']) as any
  }

  addCryptoInfo(crypto: CryptoKey, otherInfo: unknown): void {
    this.cryptoAssetInfo.set(crypto, otherInfo)
  }

  addFiatInfo(fiat: FiatKey, otherInfo: unknown): void {
    this.fiatAssetInfo.set(fiat, otherInfo)
  }

  getCryptoInfo(crypto: CryptoKey): unknown {
    return this.cryptoAssetInfo.get(crypto)
  }

  getFiatInfo(fiat: FiatKey): unknown {
    return this.fiatAssetInfo.get(fiat)
  }

  getFiatProviderAssetMap(query: FiatProviderAssetMapQuery): FiatProviderAssetMap {
    const fiatProviderAssetMap: FiatProviderAssetMap = {
      providerId: this.providerId,
      crypto: {},
      fiat: {}
    }

    const regionNodes = queryNodes([this.supportTree], query.direction)
    if (regionNodes.length === 0) return fiatProviderAssetMap

    const fiatNodes = queryNodes(regionNodes, query.region)
    if (fiatNodes.length === 0) return fiatProviderAssetMap

    for (const fiatNode of fiatNodes) {
      for (const fiatKey of fiatNode.keys()) {
        const paymentNodes = fiatNode.get(fiatKey)
        if (paymentNodes == null) continue
        const result = queryNodes([paymentNodes], query.payment)

        // Skip if no payment matches:
        if (result.length === 0) continue

        if (fiatKey === '*') {
          // Add all fiat keys to fiat map:
          for (const fiatKey of fiatNode.keys()) {
            // Except for qualifiers:
            if (fiatKey === '*') continue
            fiatProviderAssetMap.fiat[fiatKey] = true
          }
        } else {
          // Add fiat to fiat map:
          fiatProviderAssetMap.fiat[fiatKey] = true
        }
      }
    }

    // Fiat tree must had no payments:
    const paymentNodes = queryNodes(fiatNodes, '*')
    const cryptoNodes = queryNodes(paymentNodes, query.payment)

    const tokenIdMap: { [pluginId: string]: Set<EdgeTokenId> } = {}
    for (const cryptoNode of cryptoNodes) {
      for (const cryptoKey of cryptoNode.keys()) {
        if (cryptoKey === '*') continue
        const [pluginId, tokenIdString] = cryptoKey.split(':')
        const tokenId: EdgeTokenId = tokenIdString === 'null' ? null : tokenIdString

        // Add fiat to crypto array for pluginId:
        ;(tokenIdMap[pluginId] = tokenIdMap[pluginId] ?? new Set()).add(tokenId)
      }
    }
    for (const [pluginId, tokenSet] of Object.entries(tokenIdMap)) {
      fiatProviderAssetMap.crypto[pluginId] = Array.from(tokenSet).map(tokenId => ({ tokenId }))
    }

    return fiatProviderAssetMap
  }

  fromJson(json: string): void {
    const obj = asProviderSupportObject(json)
    this.fromJsonObject(obj)
  }

  fromJsonObject(obj: ProviderSupportObject): void {
    this.supportTree.clear()
    fromJsonObject(this.supportTree, obj)
  }

  toJson(): string {
    return wasProviderSupportObject(this.toJsonObject())
  }

  toJsonObject(): ProviderSupportObject {
    const obj: any = {}
    return toJsonObject(obj, this.supportTree)
  }
}

function toJsonObject(obj: any, tree: InternalTree): ProviderSupportObject {
  for (const [key, node] of tree.entries()) {
    if (node.size === 0) {
      obj[key] = true
      continue
    }
    // Value is a nested object:
    obj[key] = {}
    toJsonObject(obj[key], node)
  }
  return obj
}

function fromJsonObject(tree: InternalTree, obj: any): void {
  for (const [key, value] of Object.entries(obj)) {
    // Create node if doesn't exit:
    const node = tree.get(key) ?? new Map()
    tree.set(key, node)
    // Recurse if value is an object:
    if (typeof value === 'object') {
      fromJsonObject(node, value)
    }
  }
}

interface GenericAddApi {
  [method: string]: (key: string) => GenericAddApi | undefined
}
function makeAddApi(tree: InternalTree, levels: string[], level: number = 0): GenericAddApi {
  const method = levels[level]
  return {
    [method]: (key: string) => {
      // Create node if it doesn't exist:
      const node = tree.get(key) ?? new Map()
      tree.set(key, node)
      // Return more API if not at the end of the levels:
      if (level < levels.length - 1) {
        return makeAddApi(node, levels, level + 1)
      }
    }
  }
}

interface GenericQueryApi {
  supported?: boolean
  fn?: (key: string) => GenericQueryApi | undefined
}
function makeQueryApi(trees: InternalTree[], levels: string[], level: number = 0, supported?: boolean): GenericQueryApi {
  const method = levels[level] as 'fn' // this is the magical hack to make TypeScript happy
  return {
    supported,
    [method]: (query: string) => {
      // Find all matching nodes:
      const nextTrees: InternalTree[] = queryNodes(trees, query)
      const supported = nextTrees.length !== 0

      // Return more API if not at the end of the levels:
      if (level < levels.length - 1) {
        return makeQueryApi(nextTrees, levels, level + 1, supported)
      } else {
        return { supported }
      }
    }
  }
}

/**
 * This is used to query the direct child nodes of a particular set of nodes.
 * It follows the string matching rules respecting the special qualifiers '*' and ''.
 *
 * @param nodes An array of nodes to query against
 * @param query A query string used to search for nested nodes (e.g. 'US:CA', 'US:*', '*', etc)
 * @returns an array of nodes that match the query
 */
export function queryNodes(nodes: InternalTree[], query: string): InternalTree[] {
  let matchFound = false
  const result: InternalTree[] = []

  const matchAnyNodes: InternalTree[] = []
  const matchAllNodes: InternalTree[] = []

  // Handle regular nodes:
  for (const node of nodes) {
    for (const entry of node.entries()) {
      const [nodeKey, childNodes] = entry

      // Ignore special nodes
      if (nodeKey === '') {
        matchAnyNodes.push(childNodes)
        continue
      }
      if (nodeKey === '*') {
        matchAllNodes.push(childNodes)
        if (keyMatchesQuery(nodeKey, query)) {
          matchFound = true
        }
        continue
      }

      if (keyMatchesQuery(nodeKey, query)) {
        matchFound = true
        result.push(childNodes)
      } else if (keyMatchesQuery(query, nodeKey)) {
        matchAllNodes.push(childNodes)
      }
    }
  }

  // Handle special nodes:
  for (const childNodes of matchAnyNodes) {
    result.push(childNodes)
  }
  if (matchFound) {
    for (const childNodes of matchAllNodes) {
      result.push(childNodes)
    }
  }

  return result
}

function keyMatchesQuery(key: string, query: string): boolean {
  const [keyGroup, keySub] = key.split(':')
  const [queryGroup, subQuery] = query.split(':')

  // Match-all:
  if (queryGroup === '*') return true

  // Match group:
  if (queryGroup === keyGroup) {
    // Exact-match:
    if (subQuery === keySub) return true
    // Group-sub match-all:
    if (subQuery === '*') return true
    // Group-sub match-any:
    if (keySub == null || keySub === '') return true
  }

  return false
}
