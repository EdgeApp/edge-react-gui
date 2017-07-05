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
