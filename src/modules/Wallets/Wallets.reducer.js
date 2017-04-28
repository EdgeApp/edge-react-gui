import * as ACTION from './Wallets.action'

const addWallet = (state = [], action) => {
  switch (action.type) {
    case ACTION.ADD_WALLET :
      console.log('Adding new wallet')
      return [...state, action.newWallet]
    default:
      return state
  }
}

const selectWallet = (state = {}, action) => {
  switch (action.type) {
    case ACTION.SELECT_WALLET :
      console.log('Selecting wallet')
      return action.selectedWallet
    default:
      return state
  }
}

export default {
  addWallet,
  selectWallet
}
