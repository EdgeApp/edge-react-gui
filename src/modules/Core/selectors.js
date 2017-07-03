export const getAccount = (state) => {
  const account = state.core.account
  return account
}

export const getContext = (state) => {
  const context = state.core.context
  return context
}

export const getIo = (state) => {
  const io = state.core.context.io
  return io
}

export const getWallet = (state, walletId) => {
  const wallet = state.core.wallets.byId[walletId]
  return wallet
}
