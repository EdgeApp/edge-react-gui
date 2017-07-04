export const getContext = (state) => {
  const context = state.core.context
  return context
}

export const getIo = (state) => {
  const io = state.core.context.io
  return io
}

export const getAccount = (state) => {
  const account = state.core.account
  return account
}

export const getUsername = (state) => {
  const username = state.core.account.username
  return username
}

export const getWallets = (state) => {
  const wallets = Object.values(state.core.wallets.byId)
  return wallets
}

export const getWallet = (state, walletId) => {
  const wallet = state.core.wallets.byId[walletId]
  return wallet
}
