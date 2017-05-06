import { makeReactNativeIo } from 'react-native-airbitz-io'
import FakeAccount from '../Fakes/FakeAccount.js'
import { addWallet, selectWallet } from './Wallets/Wallets.action.js'
import { addAccountToRedux, addAirbitzToRedux } from './Login/Login.action.js'
import { makeContext } from 'airbitz-core-js'
import {disableLoadingScreenVisibility} from './Container.action'

export const initializeAccount = () => {

  return (dispatch, getState, imports) => {
    makeReactNativeIo().then( io => {
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
    .then(() => {
    // create a fake wallet, select first wallet
    const walletType = 'wallet.repo.myFakeWalletType'
    const walletKeys = ['MASTER_PRIVATE_KEY', 'MASTER_PUBLIC_KEY']
    const newWalletId = FakeAccount.createWallet(walletType, walletKeys)
        .then(walletId => {
        const newWallet = FakeAccount.getWallet(walletId)
        newWallet.name = 'Original'
        // add wallet to redux, select wallet
        dispatch(addWallet(newWallet, 0))
        dispatch(selectWallet(newWallet.id))
        })

        
    }) 
    return dispatch(disableLoadingScreenVisibility())
  }
}