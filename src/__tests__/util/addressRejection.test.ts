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
    expect(describeAddressRejection({ type: 'unrecognized' })).toBe(
      'This address does not match any network Edge can send to from this wallet.'
    )
  })

  it('takes the app name from the app config', () => {
    const { appName } = config
    config.appName = 'Acme Wallet'
    try {
      expect(describeAddressRejection({ type: 'unrecognized' })).toBe(
        'This address does not match any network Acme Wallet can send to from this wallet.'
      )
    } finally {
      config.appName = appName
    }
  })

  it('gives every rejection a distinct, non-empty reason', () => {
    const rejections: AddressRejection[] = [
      { type: 'invalid', networkName: 'Ethereum' },
      { type: 'otherNetwork', networkName: 'Ethereum' },
      { type: 'unrecognized' }
    ]
    const messages = rejections.map(describeAddressRejection)
    for (const message of messages) expect(message).not.toBe('')
    expect(new Set(messages).size).toBe(rejections.length)
  })
})
