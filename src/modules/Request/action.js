// @flow

export const updateAmountRequestedInCrypto = (amountSatoshi: number) => ({
  type: 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO',
  data: { amountSatoshi }
})

export const updateAmountRequestedInFiat = (amountFiat: number) => ({
  type: 'UPDATE_AMOUNT_REQUESTED_IN_FIAT',
  data: { amountFiat }
})
