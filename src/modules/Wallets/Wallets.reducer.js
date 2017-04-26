import * as ACTION from './Wallets.action'

export default wallets = (state = [], action) => {
  switch (action.type) {
    case ACTION.ADD_WALLET :
      console.warn('Adding new wallet')

      return [...state, action.newWallet]
    default:
      return state
  }
}
