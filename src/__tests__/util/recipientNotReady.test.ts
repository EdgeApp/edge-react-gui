import { describe, expect, it } from '@jest/globals'

import { I18nError } from '../../components/cards/ErrorCard'
import { describeRecipientNotReady } from '../../util/recipientNotReady'

/** The error an engine throws, as it arrives through the core bridge. */
const makeRefusal = (reason: string): Error => {
  const error = new Error('The engine message')
  return Object.assign(error, {
    name: 'RecipientNotReadyError',
    reason,
    currencyCode: 'USDC'
  })
}

describe('describeRecipientNotReady', () => {
  it('says the recipient account is not activated', () => {
    const error = describeRecipientNotReady(
      makeRefusal('accountNotActivated'),
      'Stellar'
    )
    expect(error).toBeInstanceOf(I18nError)
    expect(error?.title).toBe('Transaction Failure')
    expect(error?.message).toBe(
      "The recipient's Stellar account isn't activated, so it can't receive USDC yet."
    )
  })

  it('says the recipient has not added the token', () => {
    expect(
      describeRecipientNotReady(makeRefusal('tokenNotAdded'), 'Stellar')
        ?.message
    ).toBe(
      "The recipient hasn't added USDC to their Stellar wallet, so it can't receive USDC yet."
    )
  })

  it('says the issuer has not authorized the recipient', () => {
    expect(
      describeRecipientNotReady(makeRefusal('notAuthorized'), 'Stellar')
        ?.message
    ).toBe("The USDC issuer hasn't authorized the recipient to receive USDC.")
  })

  it("shows the engine's message for a reason it does not know", () => {
    expect(
      describeRecipientNotReady(makeRefusal('somethingNew'), 'Stellar')?.message
    ).toBe('The engine message')
  })

  it('leaves other errors alone', () => {
    expect(
      describeRecipientNotReady(new Error('Network down'), 'Stellar')
    ).toBeUndefined()
    expect(describeRecipientNotReady(undefined, 'Stellar')).toBeUndefined()
  })
})
