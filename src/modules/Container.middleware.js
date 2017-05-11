import { makeReactNativeIo } from 'react-native-airbitz-io'
import { FakeTxEngine } from '../Fakes/FakeTxEngine.js'
import { addWallet as addWalletUI } from './UI/Wallets/Wallets.action.js'
import { selectWallet as selectWalletUI } from './UI/Wallets/Wallets.action.js'
import { addAccountToRedux, addAirbitzToRedux } from './Login/Login.action.js'
import { makeContext } from 'airbitz-core-js'
import { disableLoadingScreenVisibility } from './Container.action'
import { addTransaction } from './Transactions/Transactions.action.js'

export const initializeAccount = (dispatch) => {
  makeReactNativeIo().then(io => {
    const context = makeContext({
      apiKey: '0b5776a91bf409ac10a3fe5f3944bf50417209a0',
      io
    })
    dispatch(addAirbitzToRedux(context))
    const account = context.loginWithPassword('bob19', 'Funtimes19')

    return account
  })
  .then(account => {
    dispatch(addAccountToRedux(account))

    return account
  })
  .then(account => {
    const walletIds = account.listWalletIds()

    const wallets = walletIds.map(id => {
      wallet = account.getWallet(id)
      wallet.id = id
      wallet.name = 'myFakeWallet - ' + id.slice(0, 5)

      return wallet
    })

    wallets.slice(0, 5).forEach(wallet => {
      dispatch(addWalletUI(wallet, 0))
    })

    dispatch(selectWalletUI(account.listWalletIds()[0]))
  })
  .then(() => {
    const engine = new FakeTxEngine()
    const transactions = engine.getTransactions()

    return transactions
  })
  .then(transactions => {
    transactions.forEach(transaction => {
      dispatch(addTransaction(transaction))
    })
  })

  return dispatch(disableLoadingScreenVisibility())
}
