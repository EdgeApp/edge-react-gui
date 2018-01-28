// @flow

import type {AbcContext} from 'edge-login'

export const getCurrencyPlugins = (context: AbcContext) => {
  return context.getCurrencyPlugins()
}

export const deleteLocalAccount = (context: AbcContext, username: string) => {
  return context.deleteLocalAccount(username)
}

export const listUsernames = (context: AbcContext) => {
  return context.listUsernames()
}

export const getExchangeSwapRate = (context: AbcContext, sourceCurrencyCode: string, targetCurrencyCode: string) => {
  return context.getExchangeSwapRate(sourceCurrencyCode, targetCurrencyCode)
}

export const getExchangeSwapInfo = (context: AbcContext, sourceCurrencyCode: string, targetCurrencyCode: string) => {
  // $FlowExpectedError
  return context.getExchangeSwapInfo(sourceCurrencyCode, targetCurrencyCode)
}

// TODO Allen: Function that returns exchange rate.
