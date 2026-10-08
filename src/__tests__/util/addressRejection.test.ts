import { describe, expect, it } from '@jest/globals'

import { config } from '../../theme/appConfig'
import {
  type AddressRejection,
  describeAddressRejection
} from '../../util/addressRejection'

describe('describeAddressRejection', () => {
  it('names the network an invalid address was read against', () => {
    expect(
      describeAddressRejection({ type: 'invalid', networkName: 'Arbitrum One' })
    ).toBe('This is not a valid Arbitrum One address.')
  })

  it('says a send that cannot swap only takes its own network', () => {
    expect(
      describeAddressRejection({ type: 'otherNetwork', networkName: 'Bitcoin' })
    ).toBe(
      'This address is on another network. This send can only go to an address on Bitcoin.'
    )
  })

  it('says when no network recognizes the text, naming the app', () => {
    expect(
      describeAddressRejection({
        type: 'unrecognized',
        networkName: 'Ethereum'
      })
    ).toBe(
      'This is not a valid Ethereum address, and it does not match any other network Edge can send to from this wallet.'
    )
  })

  it('names both networks when the address is on the wallet network', () => {
    expect(
      describeAddressRejection({
        type: 'ownNetwork',
        networkName: 'Bitcoin',
        payoutNetworkName: 'Ethereum'
      })
    ).toBe(
      'This is a Bitcoin address, but the recipient is set to receive on Ethereum. Change what the recipient receives to send to this address.'
    )
  })

  it('takes the app name from the app config', () => {
    const { appName } = config
    config.appName = 'Acme Wallet'
    try {
      expect(
        describeAddressRejection({
          type: 'unrecognized',
          networkName: 'Bitcoin'
        })
      ).toBe(
        'This is not a valid Bitcoin address, and it does not match any other network Acme Wallet can send to from this wallet.'
      )
    } finally {
      config.appName = appName
    }
  })

  it('gives every rejection a distinct, non-empty reason', () => {
    const rejections: AddressRejection[] = [
      { type: 'invalid', networkName: 'Ethereum' },
      { type: 'otherNetwork', networkName: 'Ethereum' },
      { type: 'unrecognized', networkName: 'Ethereum' },
      {
        type: 'ownNetwork',
        networkName: 'Ethereum',
        payoutNetworkName: 'Bitcoin'
      }
    ]
    const messages = rejections.map(describeAddressRejection)
    for (const message of messages) expect(message).not.toBe('')
    expect(new Set(messages).size).toBe(rejections.length)
  })
})
