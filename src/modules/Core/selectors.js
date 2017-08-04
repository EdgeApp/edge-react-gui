export const getContext = (state) => {
  const context = state.core.context.context
  return context
}

export const getIO = (state) => {
  const context = getContext(state)
  const io = context.io
  return io
}

export const getAccount = (state) => {
  const account = state.core.account
  return account
}

export const getUsername = (state) => {
  const account = getAccount(state)
  const username = account.username
  return username
}

export const getUsernames = (state) => {
  const usernames = state.core.context.usernames
  return usernames
}

export const getWallets = (state) => {
  const wallets = Object.values(state.core.wallets.byId)
  return wallets
}

export const getWallet = (state, walletId) => {
  const wallet = state.core.wallets.byId[walletId]
  return wallet
}

export const getCurrencyConverter = (state) => {
  const account = getAccount(state)
  const currencyConverter = account.exchangeCache
  return currencyConverter
}

export const getExchangeRate = (state, fromCurrencyCode, toCurrencyCode) => {
  const currencyConverter = getCurrencyConverter(state)
  const exchangeRate = currencyConverter.currencyConverter(fromCurrencyCode, toCurrencyCode, 1)
  return exchangeRate
}

export const getBalanceInCrypto = (state, walletId, currencyCode) => {
  const balanceInCrypto = getWallet(state, walletId).getBalance(currencyCode)
  console.log('balanceInCrypto', balanceInCrypto)
  return balanceInCrypto
}
