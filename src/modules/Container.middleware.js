import { makeReactNativeIo } from 'react-native-airbitz-io'
import FakeAccount from '../Fakes/FakeAccount.js'
import { addWallet, selectWallet } from './UI/Wallets/Wallets.action.js'
import { addAccountToRedux, addAirbitzToRedux } from './Login/Login.action.js'
import { makeContext } from 'airbitz-core-js'
import {disableLoadingScreenVisibility} from './Container.action'

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
      console.log('inside second then clause')
      dispatch(addAccountToRedux(account))

      return account
    })
    .then((account) => {
      const walletIds = account.listWalletIds()
      const wallets = walletIds.map(id => {
        wallet = account.getWallet(id)
        wallet.id = id
        wallet.name = 'myFakeWallet - ' + id.slice(0, 5)

        return wallet
      })

      wallets.forEach(wallet => {
        dispatch(addWallet(wallet, 0))
      })
    })
  return dispatch(disableLoadingScreenVisibility())
}
