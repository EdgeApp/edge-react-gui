import { EdgeTokenId } from 'edge-core-js'

import { FiatProviderAssetMap } from '../fiatProviderTypes'

type NodeType = 'direction' | 'payment' | 'region' | 'fiat' | 'plugin' | 'crypto'
type NodeKey = `${NodeType}:${string}` | '*'
type Tree<Leaf> = Map<NodeKey, Tree<Leaf> | Leaf>
type SupportTree = Tree<true>
type OtherInfoTree = Tree<unknown>
type JsonSupportTree = { [key in NodeKey]: JsonSupportTree | boolean }

/**
 * A class to store support information for a provider.
 *
 * Usage Examples:
 *
 * ```typescript
 * const providerSupport = new ProviderSupportStore(providerId)
 *
 * // Add support for directions:
 * providerSupport.addSupport('direction:buy')
 * providerSupport.addSupport('direction:sell')
 *
 * // Add support for payment types under all directions:
 * providerSupport.addSupport('direction:*', 'payment:credit')
 * providerSupport.addSupport('direction:*', 'payment:ach')
 *
 * // Add support for payment types under the buy direction only:
 * providerSupport.addSupport('direction:buy', 'payment:applepay')
 *
 * // Add support for currency under all directions and payment types:
 * const path = providerSupport.addSupport('direction:*', 'payment:*', 'fiat:USD', 'plugin:bitcoin', 'crypto:null')
 *
 * // Add otherInfo for the USD/Bitcoin pair:
 * providerSupport.addOtherInfo(path, { min: 10, max: 100 })
 *
 * // Check if the provider supports buying USD with Bitcoin:
 * const isSupported = providerSupport.isSupported('direction:buy', 'payment:*', 'fiat:USD', 'plugin:bitcoin', 'crypto:null')
 *
 * // Get the otherInfo for the USD/Bitcoin pair:
 * const otherInfo = providerSupport.getOtherInfo('direction:buy', 'payment:*', 'fiat:USD', 'plugin:bitcoin', 'crypto:null')
 * ```
 */
export class ProviderSupportStore {
  providerId: string
  private readonly support: SupportTree = new Map()
  private readonly otherInfo: OtherInfoTree = new Map()

  constructor(providerId: string) {
    this.providerId = providerId
  }

  addSupport(...keys: NodeKey[]): NodeKey[] {
    this.addToTree(this.support, keys, true)
    return keys
  }

  addOtherInfo(path: NodeKey[], info: unknown): void {
    this.addToTree(this.otherInfo, path, info)
  }

  getOtherInfo(...keys: NodeKey[]): unknown {
    const subTree = this.getSubTree(this.otherInfo, keys)
    if (subTree == null) return undefined
    return subTree.get(keys[keys.length - 1])
  }

  getFiatProviderAssetMap(...keys: NodeKey[]): FiatProviderAssetMap {
    const fiatProviderAssetMap: FiatProviderAssetMap = {
      providerId: this.providerId,
      crypto: {},
      fiat: {}
    }

    const subTree = this.getSubTree(this.support, keys)
    if (subTree == null) {
      return fiatProviderAssetMap
    }

    // Iterate through the subTree searching for fiat/plugin/crypto node types
    // to build the asset map:
    for (const [fiatNodeKey, pluginNode] of subTree) {
      const [nodeType, fiatCurrencyCode] = this.keyToNode(fiatNodeKey)

      // Only search for fiat node types at this level:
      if (nodeType !== 'fiat') continue

      // Only include fiat currency codes (not wildcards):
      if (fiatCurrencyCode !== '*') fiatProviderAssetMap.fiat[fiatCurrencyCode] = true

      // Assert the next node has children:
      if (pluginNode === true) continue

      for (const [pluginNodeKey, cryptoNode] of pluginNode) {
        const [nodeType, pluginId] = this.keyToNode(pluginNodeKey)

        // Only search for plugin node types at this level:
        if (nodeType !== 'plugin') continue

        // Assert the next node has children:
        if (cryptoNode === true) continue

        for (const [cryptoNodeKey] of cryptoNode) {
          const [nodeType, tokenIdValue] = this.keyToNode(cryptoNodeKey)

          // Only search for crypto node types at this level:
          if (nodeType !== 'crypto') continue

          // Only include tokenId values (not wildcards):
          if (tokenIdValue === '*') continue

          const tokenId: EdgeTokenId = tokenIdValue === 'null' ? null : tokenIdValue

          // Add the tokenId to the fiatProviderAssetMap:
          const otherInfo = this.getOtherInfo(...keys, fiatNodeKey, pluginNodeKey, cryptoNodeKey)
          fiatProviderAssetMap.crypto[pluginId] = fiatProviderAssetMap.crypto[pluginId] ?? []
          fiatProviderAssetMap.crypto[pluginId].push({ tokenId, otherInfo })
        }
      }
    }

    return fiatProviderAssetMap
  }

  isSupported(...keys: NodeKey[]): boolean {
    return this.isSupportedRecursive(this.support, keys, 0)
  }

  private isSupportedRecursive(tree: SupportTree = this.support, path: NodeKey[], level: number): boolean {
    const key = path[level]
    const [nodeType, value] = this.keyToNode(key)
    const nodeKeys = nodeType === '*' ? Array.from(tree.keys()) : value === '*' ? Array.from(tree.keys()).filter(k => k.startsWith(nodeType)) : [key]

    // Add wildcard search
    nodeKeys.push('*')
    if (nodeType !== '*') nodeKeys.push(`${nodeType}:*`)

    const results = nodeKeys.some((nodeKey): boolean => {
      const node = tree.get(nodeKey)
      if (node instanceof Map) {
        if (level === path.length - 1) {
          return true
        }
        return this.isSupportedRecursive(node, path, level + 1)
      }
      if (node === true) {
        if (level === path.length - 1) return true
        return false
      }
      return false
    })
    if (results) return true

    // We've reached the end of the keys and the last node is not a boolean
    return false
  }

  toJson(): string {
    // Convert the support Map tree to a JSON string:
    return JSON.stringify(this.toJsonObject())
  }

  toJsonObject(tree: SupportTree = this.support): object {
    const result: { [key: string]: object | boolean } = {}

    for (const [key, value] of tree.entries()) {
      if (value === true) {
        result[key.toString()] = true
      } else if (value instanceof Map) {
        result[key.toString()] = this.toJsonObject(value)
      }
    }

    return result
  }

  fromJson(json: string): void {
    const data = JSON.parse(json)
    this.support.clear()
    this.fromJsonObject(data, this.support)
  }

  fromJsonObject(data: { [key in NodeKey]: JsonSupportTree | boolean }, node: SupportTree): void {
    for (const entry of Object.entries(data)) {
      const [key, value] = entry as [NodeKey, JsonSupportTree | boolean]
      if (value === true) {
        node.set(key, true)
      } else if (typeof value === 'object') {
        const childNode = new Map()
        node.set(key, childNode)
        this.fromJsonObject(value, childNode)
      }
    }
  }

  private addToTree<T>(tree: Tree<T>, path: NodeKey[], value: T): void {
    const nodes: Array<Tree<T>> = [tree]
    for (let i = 0; i < path.length; ++i) {
      const key = path[i]
      const lastNode = nodes[nodes.length - 1]
      const nextNode = lastNode.get(key)
      // Continue if node exits:
      if (nextNode instanceof Map) {
        nodes.push(nextNode)
        continue
      }
      // If we've reached the end of the keys (path), set the last node to true:
      if (i === path.length - 1) {
        lastNode.set(key, value)
        continue
      }
      // Create new node if it doesn't exist or if it's a leaf:
      const newNode = new Map()
      nodes.push(newNode)
      lastNode.set(key, newNode)
    }
  }

  private getSubTree<T>(tree: Tree<T>, path: NodeKey[], level: number = 0): Tree<T> | undefined {
    const key = path[level]
    const [nodeType, value] = this.keyToNode(key)
    const nodeKeys = nodeType === '*' ? Array.from(tree.keys()) : value === '*' ? Array.from(tree.keys()).filter(k => k.startsWith(nodeType)) : [key]

    for (const nodeKey of nodeKeys) {
      const node = tree.get(nodeKey)
      if (node instanceof Map) {
        if (level === path.length - 1) {
          return node
        }
        const result = this.getSubTree(node, path, level + 1)
        if (result != null) return result
      } else if (node != null) {
        if (level === path.length - 1) {
          return tree
        }
      }
    }

    return undefined
  }

  private keyToNode(key: NodeKey): [NodeType | '*', string] {
    const [nodeType, ...rest] = key.split(':') as [NodeType | '*', string]
    return [nodeType, rest.join(':')]
  }
}
