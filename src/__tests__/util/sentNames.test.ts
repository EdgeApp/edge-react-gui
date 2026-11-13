import { describe, expect, it } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import type { EdgeAccount, EdgeSpendTarget } from 'edge-core-js'

import { addToFioAddressCache } from '../../util/FioAddressUtils'
import {
  addToSentNames,
  getAcceptedNameSends,
  hasSentToName,
  type NameSend,
  type RecipientName,
  type TileNameRecipient
} from '../../util/sentNames'

const ALICE_ADDRESS = '0x00000000000000000000000000000000000000aa'
const ALICE_CHECKSUMMED = '0x00000000000000000000000000000000000000AA'
const OTHER_ADDRESS = '0x00000000000000000000000000000000000000cc'

const ALICE_FIO: RecipientName = { service: 'fio', name: 'alice@edge' }
const ALICE_UD: RecipientName = { service: 'unstoppable', name: 'alice.wallet' }

const makeAccount = (): EdgeAccount =>
  ({ disklet: makeMemoryDisklet() } as unknown as EdgeAccount)

describe('sent names', () => {
  it('starts empty', async () => {
    expect(await hasSentToName(makeAccount(), ALICE_UD, ALICE_ADDRESS)).toBe(
      false
    )
  })

  it('matches a recorded send ignoring the name case', async () => {
    const account = makeAccount()
    await addToSentNames(account, [
      {
        service: 'unstoppable',
        name: 'Alice.Wallet',
        publicAddress: ALICE_ADDRESS
      }
    ])
    expect(await hasSentToName(account, ALICE_UD, ALICE_ADDRESS)).toBe(true)
    expect(
      await hasSentToName(
        account,
        { service: 'unstoppable', name: 'ALICE.WALLET' },
        ALICE_ADDRESS
      )
    ).toBe(true)
  })

  it('does not match once the name resolves somewhere else', async () => {
    const account = makeAccount()
    await addToSentNames(account, [
      { ...ALICE_UD, publicAddress: ALICE_ADDRESS }
    ])
    expect(await hasSentToName(account, ALICE_UD, OTHER_ADDRESS)).toBe(false)
  })

  it('matches an EVM address in either checksum case', async () => {
    const account = makeAccount()
    await addToSentNames(account, [
      { ...ALICE_UD, publicAddress: ALICE_CHECKSUMMED }
    ])
    expect(await hasSentToName(account, ALICE_UD, ALICE_ADDRESS)).toBe(true)

    const lowerFirst = makeAccount()
    await addToSentNames(lowerFirst, [
      { ...ALICE_UD, publicAddress: ALICE_ADDRESS }
    ])
    expect(await hasSentToName(lowerFirst, ALICE_UD, ALICE_CHECKSUMMED)).toBe(
      true
    )
  })

  it('matches other address formats only in the same case', async () => {
    const account = makeAccount()
    const zcashName: RecipientName = { service: 'zns', name: 'alice.zcash' }
    await addToSentNames(account, [
      { ...zcashName, publicAddress: 't1AliceAddress' }
    ])
    expect(await hasSentToName(account, zcashName, 't1AliceAddress')).toBe(true)
    expect(await hasSentToName(account, zcashName, 't1aliceaddress')).toBe(
      false
    )
  })

  it('keeps each service apart', async () => {
    const account = makeAccount()
    await addToSentNames(account, [
      { service: 'ens', name: 'alice.eth', publicAddress: ALICE_ADDRESS }
    ])
    expect(
      await hasSentToName(
        account,
        { service: 'plugin', name: 'alice.eth' },
        ALICE_ADDRESS
      )
    ).toBe(false)
  })

  it('keeps every address a name was sent to', async () => {
    const account = makeAccount()
    await addToSentNames(account, [
      { ...ALICE_UD, publicAddress: ALICE_ADDRESS }
    ])
    await addToSentNames(account, [
      { ...ALICE_UD, publicAddress: OTHER_ADDRESS },
      { ...ALICE_UD, publicAddress: ALICE_ADDRESS }
    ])
    expect(await hasSentToName(account, ALICE_UD, ALICE_ADDRESS)).toBe(true)
    expect(await hasSentToName(account, ALICE_UD, OTHER_ADDRESS)).toBe(true)
  })

  it('reads FIO sends recorded in the older FIO-only list', async () => {
    const account = makeAccount()
    await account.disklet.setText(
      'FioSentAddresses.json',
      JSON.stringify({ addresses: { 'alice@edge': [ALICE_ADDRESS] } })
    )
    expect(await hasSentToName(account, ALICE_FIO, ALICE_ADDRESS)).toBe(true)
    expect(
      await hasSentToName(
        account,
        { service: 'zano', name: 'alice@edge' },
        ALICE_ADDRESS
      )
    ).toBe(false)

    // A new send keeps the older entries:
    await addToSentNames(account, [
      { ...ALICE_UD, publicAddress: ALICE_ADDRESS }
    ])
    await account.disklet.delete('FioSentAddresses.json')
    expect(await hasSentToName(account, ALICE_FIO, ALICE_ADDRESS)).toBe(true)
  })

  it('ignores handles written to the FIO address cache', async () => {
    const account = makeAccount()
    await addToFioAddressCache(account, ['scammer@thorchain'])
    expect(
      await hasSentToName(
        account,
        { service: 'fio', name: 'scammer@thorchain' },
        ALICE_ADDRESS
      )
    ).toBe(false)
  })
})

describe('getAcceptedNameSends', () => {
  const accepted: NameSend = { ...ALICE_UD, publicAddress: ALICE_ADDRESS }

  const tileRecipient = (paidAddress: string): TileNameRecipient => ({
    paidAddress,
    send: accepted
  })

  it('returns a name the address tile resolved for the paid address', () => {
    const target: EdgeSpendTarget = { publicAddress: ALICE_ADDRESS }
    const tileRecipients = new WeakMap([[target, tileRecipient(ALICE_ADDRESS)]])
    expect(getAcceptedNameSends([target], tileRecipients)).toEqual([accepted])
  })

  it('records the resolved address when parsing normalized the paid one', async () => {
    const target: EdgeSpendTarget = { publicAddress: ALICE_CHECKSUMMED }
    const tileRecipients = new WeakMap([
      [target, tileRecipient(ALICE_CHECKSUMMED)]
    ])
    const account = makeAccount()
    await addToSentNames(
      account,
      getAcceptedNameSends([target], tileRecipients)
    )
    expect(await hasSentToName(account, ALICE_UD, ALICE_ADDRESS)).toBe(true)
  })

  it('ignores a name and address the caller put in otherParams', () => {
    const target: EdgeSpendTarget = {
      publicAddress: ALICE_ADDRESS,
      otherParams: { fioAddress: 'alice@edge', fioPublicAddress: ALICE_ADDRESS }
    }
    expect(getAcceptedNameSends([target], new WeakMap())).toEqual([])
  })

  it('skips a target that no longer pays the address the tile gave it', () => {
    const target: EdgeSpendTarget = { publicAddress: OTHER_ADDRESS }
    const tileRecipients = new WeakMap([[target, tileRecipient(ALICE_ADDRESS)]])
    expect(getAcceptedNameSends([target], tileRecipients)).toEqual([])
  })
})
