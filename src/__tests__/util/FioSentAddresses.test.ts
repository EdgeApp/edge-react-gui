import { describe, expect, it } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import type { EdgeAccount, EdgeSpendTarget } from 'edge-core-js'

import {
  addToFioAddressCache,
  addToFioSentAddresses,
  type FioSentAddress,
  getAcceptedFioSends,
  hasSentToFioAddress,
  type TileFioRecipient
} from '../../util/FioAddressUtils'

const ALICE_ADDRESS = '0x00000000000000000000000000000000000000aa'
const ALICE_CHECKSUMMED = '0x00000000000000000000000000000000000000AA'
const OTHER_ADDRESS = '0x00000000000000000000000000000000000000cc'

const makeAccount = (): EdgeAccount =>
  ({ disklet: makeMemoryDisklet() } as unknown as EdgeAccount)

describe('FIO sent addresses', () => {
  it('starts empty', async () => {
    expect(
      await hasSentToFioAddress(makeAccount(), 'alice@edge', ALICE_ADDRESS)
    ).toBe(false)
  })

  it('matches a recorded send ignoring the handle case', async () => {
    const account = makeAccount()
    await addToFioSentAddresses(account, [
      { fioAddress: 'Alice@Edge', publicAddress: ALICE_ADDRESS }
    ])
    expect(
      await hasSentToFioAddress(account, 'alice@edge', ALICE_ADDRESS)
    ).toBe(true)
    expect(
      await hasSentToFioAddress(account, 'ALICE@EDGE', ALICE_ADDRESS)
    ).toBe(true)
  })

  it('does not match once the handle resolves somewhere else', async () => {
    const account = makeAccount()
    await addToFioSentAddresses(account, [
      { fioAddress: 'alice@edge', publicAddress: ALICE_ADDRESS }
    ])
    expect(
      await hasSentToFioAddress(account, 'alice@edge', OTHER_ADDRESS)
    ).toBe(false)
  })

  it('keeps every address a handle was sent to', async () => {
    const account = makeAccount()
    await addToFioSentAddresses(account, [
      { fioAddress: 'alice@edge', publicAddress: ALICE_ADDRESS }
    ])
    await addToFioSentAddresses(account, [
      { fioAddress: 'alice@edge', publicAddress: OTHER_ADDRESS },
      { fioAddress: 'alice@edge', publicAddress: ALICE_ADDRESS }
    ])
    expect(
      await hasSentToFioAddress(account, 'alice@edge', ALICE_ADDRESS)
    ).toBe(true)
    expect(
      await hasSentToFioAddress(account, 'alice@edge', OTHER_ADDRESS)
    ).toBe(true)
  })

  it('ignores handles written to the FIO address cache', async () => {
    const account = makeAccount()
    await addToFioAddressCache(account, ['scammer@thorchain'])
    expect(
      await hasSentToFioAddress(account, 'scammer@thorchain', ALICE_ADDRESS)
    ).toBe(false)
  })
})

describe('getAcceptedFioSends', () => {
  const accepted: FioSentAddress = {
    fioAddress: 'alice@edge',
    publicAddress: ALICE_ADDRESS
  }

  const tileRecipient = (paidAddress: string): TileFioRecipient => ({
    paidAddress,
    send: accepted
  })

  it('returns a handle the address tile resolved for the paid address', () => {
    const target: EdgeSpendTarget = { publicAddress: ALICE_ADDRESS }
    const tileRecipients = new WeakMap([[target, tileRecipient(ALICE_ADDRESS)]])
    expect(getAcceptedFioSends([target], tileRecipients)).toEqual([accepted])
  })

  it('records the resolved address when parsing normalized the paid one', async () => {
    const target: EdgeSpendTarget = { publicAddress: ALICE_CHECKSUMMED }
    const tileRecipients = new WeakMap([
      [target, tileRecipient(ALICE_CHECKSUMMED)]
    ])
    const account = makeAccount()
    await addToFioSentAddresses(
      account,
      getAcceptedFioSends([target], tileRecipients)
    )
    expect(
      await hasSentToFioAddress(account, 'alice@edge', ALICE_ADDRESS)
    ).toBe(true)
  })

  it('ignores a handle and address the caller put in otherParams', () => {
    const target: EdgeSpendTarget = {
      publicAddress: ALICE_ADDRESS,
      otherParams: { fioAddress: 'alice@edge', fioPublicAddress: ALICE_ADDRESS }
    }
    expect(getAcceptedFioSends([target], new WeakMap())).toEqual([])
  })

  it('skips a target that no longer pays the address the tile gave it', () => {
    const target: EdgeSpendTarget = { publicAddress: OTHER_ADDRESS }
    const tileRecipients = new WeakMap([[target, tileRecipient(ALICE_ADDRESS)]])
    expect(getAcceptedFioSends([target], tileRecipients)).toEqual([])
  })
})
