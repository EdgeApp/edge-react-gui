// @flow

import type { EdgeContext } from 'edge-core-js'

export const deleteLocalAccount = (context: EdgeContext, username: string) => {
  return context.deleteLocalAccount(username)
}

export const listUsernames = (context: EdgeContext) => {
  return context.listUsernames()
}

export const getExchangeSwapRate = (context: EdgeContext, sourceCurrencyCode: string, targetCurrencyCode: string) => {
  return context.getExchangeSwapRate(sourceCurrencyCode, targetCurrencyCode)
}

export const getExchangeSwapInfo = (context: EdgeContext, sourceCurrencyCode: string, targetCurrencyCode: string) => {
  // $FlowExpectedError
  return context.getExchangeSwapInfo(sourceCurrencyCode, targetCurrencyCode)
}

// TODO Allen: Function that returns exchange rate.
