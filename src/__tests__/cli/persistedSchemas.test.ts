import { describe, expect, it } from '@jest/globals'

import {
  asEdgeAssetAction,
  asEdgeMetadata,
  asEdgeMetadataChange,
  asEdgeTxAction
} from '../../cli/engine/schemas'

/**
 * These three shapes go into the wallet's synced transaction file, and core
 * validates nothing between an HTTP body and the disklet — so the cleaner
 * here is the only thing standing between a caller and that file.
 */
describe('asEdgeMetadataChange', () => {
  it('accepts an empty change and a null deletion', () => {
    // `toEqual` rather than `toStrictEqual`: `asObject` materialises every
    // declared key, and core's `mergeMetadata` reads an explicit `undefined`
    // as "leave this field unchanged", which is what an absent field means.
    expect(asEdgeMetadataChange({})).toEqual({})
    expect(asEdgeMetadataChange({ notes: 'hi', bizId: null })).toEqual({
      notes: 'hi',
      bizId: null
    })
    expect(
      asEdgeMetadataChange({ exchangeAmount: { 'iso:USD': 1.5 } })
    ).toEqual({ exchangeAmount: { 'iso:USD': 1.5 } })
  })

  it('refuses a non-object', () => {
    expect(() => asEdgeMetadataChange('hello')).toThrow('Expected an object')
    expect(() => asEdgeMetadataChange(123)).toThrow('Expected an object')
  })

  it('refuses an array', () => {
    // `asObject` accepts one, and core's `mergeMetadata` then reads no
    // properties off it, so the route answered 204 having written nothing.
    expect(() => asEdgeMetadataChange([])).toThrow('got an array')
  })

  it('names the field that is the wrong type', () => {
    expect(() => asEdgeMetadataChange({ notes: 123 })).toThrow('.notes')
    expect(() => asEdgeMetadataChange({ bizId: 'one' })).toThrow('.bizId')
  })
})

describe('asEdgeMetadata', () => {
  it('reads a null as an absent field, having no deletion to express', () => {
    expect(asEdgeMetadata({ notes: 'hi' })).toEqual({ notes: 'hi' })
    // `EdgeMetadata` is a plain value rather than a change set, so there is
    // nothing for `null` to delete and it means the same as omitting it.
    expect(asEdgeMetadata({ notes: null })).toEqual({})
    expect(() => asEdgeMetadata({ notes: 123 })).toThrow('.notes')
  })
})

describe('asEdgeAssetAction', () => {
  it('accepts a known assetActionType', () => {
    expect(asEdgeAssetAction({ assetActionType: 'transfer' })).toStrictEqual({
      assetActionType: 'transfer'
    })
  })

  it('refuses an unknown one, and an array', () => {
    expect(() => asEdgeAssetAction({ assetActionType: 'nope' })).toThrow()
    expect(() => asEdgeAssetAction([])).toThrow('got an array')
  })
})

describe('asEdgeTxAction', () => {
  it('accepts each actionType in the union', () => {
    const asset = { pluginId: 'bitcoin', tokenId: null }
    expect(
      asEdgeTxAction({ actionType: 'stake', pluginId: 'p', stakeAssets: [] })
    ).toMatchObject({ actionType: 'stake' })
    expect(
      asEdgeTxAction({
        actionType: 'swap',
        swapInfo: {
          pluginId: 'p',
          displayName: 'P',
          supportEmail: 'a@b.c'
        },
        fromAsset: asset,
        toAsset: asset,
        payoutAddress: 'addr',
        payoutWalletId: 'w'
      })
    ).toMatchObject({ actionType: 'swap' })
    expect(
      asEdgeTxAction({
        actionType: 'tokenApproval',
        tokenApproved: asset,
        tokenContractAddress: 'a',
        contractAddress: 'b'
      })
    ).toMatchObject({ actionType: 'tokenApproval' })

    // `fiat` and `giftCard` are the only two with nested objects, and
    // therefore the only two where the hand transcription from core's own
    // types could be wrong about a required field. These cleaners gate a
    // write to the wallet's *synced* transaction file, so a wrong
    // `asOptional` means either a legitimate `save-tx-action` 400s or a
    // malformed one reaches disk.
    expect(
      asEdgeTxAction({
        actionType: 'fiat',
        orderId: 'order-1',
        isEstimate: false,
        fiatPlugin: { providerId: 'p', providerDisplayName: 'P' },
        fiatAsset: { fiatCurrencyCode: 'iso:USD', fiatAmount: '10.00' },
        cryptoAsset: { ...asset, nativeAmount: '1000' }
      })
    ).toMatchObject({ actionType: 'fiat' })
    expect(
      asEdgeTxAction({
        actionType: 'giftCard',
        orderId: 'order-2',
        provider: { providerId: 'p', displayName: 'P' },
        card: {
          name: 'Example card',
          fiatAmount: '25.00',
          fiatCurrencyCode: 'iso:USD'
        }
      })
    ).toMatchObject({ actionType: 'giftCard' })
  })

  it('names the nested required field a fiat action is missing', () => {
    // `fiatPlugin.providerId` is required, and dropping it has to be
    // reported as that field rather than as a failed union.
    let message = ''
    try {
      asEdgeTxAction({
        actionType: 'fiat',
        orderId: 'order-1',
        isEstimate: false,
        fiatPlugin: { providerDisplayName: 'P' },
        fiatAsset: { fiatCurrencyCode: 'iso:USD', fiatAmount: '10.00' },
        cryptoAsset: { pluginId: 'bitcoin', tokenId: null }
      })
    } catch (error) {
      message = String((error as Error).message)
    }
    expect(message).toContain('providerId')
  })

  it('refuses a non-integer nativeAmount, as core does', () => {
    // Core declares `asIntegerString` here. Ours was `asString`, so "1.5"
    // passed this route, core dispatched the change before awaiting the
    // save, and the save then rejected — the engine served a `savedAction`
    // the disk did not have, and the caller got a 500.
    let message = ''
    try {
      asEdgeTxAction({
        actionType: 'stake',
        pluginId: 'p',
        stakeAssets: [
          { pluginId: 'bitcoin', tokenId: null, nativeAmount: '1.5' }
        ]
      })
    } catch (error) {
      message = String((error as Error).message)
    }
    expect(message).toContain('integer string')
  })

  it('names the missing field rather than the last alternative tried', () => {
    // `asEither` reported `Expected "giftCard"` here, naming neither the
    // field nor the shape the caller was actually aiming at.
    expect(() => asEdgeTxAction({ actionType: 'stake' })).toThrow('.pluginId')
  })

  it('refuses an unknown actionType by name', () => {
    expect(() => asEdgeTxAction({ actionType: 'nonsense' })).toThrow(
      'Unknown actionType "nonsense"'
    )
  })

  it('refuses an array', () => {
    expect(() => asEdgeTxAction([])).toThrow('got an array')
  })
})
