import { makeReactNativeIo } from 'react-native-airbitz-io'
import FakeAccount from '../Fakes/FakeAccount.js'
import { addWallet, selectWallet } from './Wallets/Wallets.action.js'
import { addAccountToRedux, addAirbitzToRedux } from './Login/Login.action.js'
import { makeContext } from 'airbitz-core-js'
import {disableLoadingScreenVisibility} from './Container.action'
import { TxLibBTC, abcTxEngine } from 'airbitz-txlib-shitcoin'

export class ABCDataStore {
  constructor (directory = '', data = {}) {
    this.dir = directory
    this.data = data
  }

// abcWallet.dataStore.listKeys(folder, callback)
  listKeys (folder) {
    const targetFolder = this.data[folder]
    let keys
    if (targetFolder) {
      keys = Object.keys(targetFolder)
      return Promise.resolve(keys)
    } else {
      return Promise.reject(new Error('Error: listKeys: invalid folder'))
    }
  }

// abcWallet.dataStore.removeKey(folder, key, callback)
  removeKey (folder, key) {
    const targetFolder = this.data[folder]
    if (targetFolder) {
      delete targetFolder[key]
      return Promise.resolve()
    } else {
      return Promise.reject(new Error('Error: removeKey: invalid folder'))
    }
  }

// abcWallet.dataStore.readData(folder, key, callback)
  readData (folder, key) {
    const targetFolder = this.data[folder]
    let targetData

    if (targetFolder) {
      targetData = targetFolder[key]
      return Promise.resolve(targetData)
    } else {
      return Promise.reject(new Error('Error: readData: invalid folder'))
    }
  }

// writeData(folder, key, value, callback)
  writeData (folder, key, newValue) {
    const folderExists = Object.keys(this.data).includes(folder)

    if (!folderExists) {
      this.data[folder] = {}
    }
    this.data[folder][key] = newValue
    return Promise.resolve()
  }

// abcWallet.dataStore.removeFolder(folder, callback)
  removeFolder (folder) {
    delete this.data[folder]
    return Promise.resolve()
  }
}

const BTCEngine = {}

const callbacks = {
    addressesChecked (...rest) {
    //console.log('addressesChecked', rest)
    },
    transactionsChanged (...rest) {
    //console.log('transactionsChanged', rest)
    },
    blockHeightChanged (...rest) {
    console.log('blockHeightChanged', rest)
    }
}

const abcTxLibAccess = {
  accountDataStore: new ABCDataStore(),
  accountLocalDataStore: new ABCDataStore(),
  walletDataStore: new ABCDataStore(),
  walletLocalDataStore: new ABCDataStore()
}

export const initializeAccount = (dispatch) => {
    console.log('walletLocalDataStore is: ', abcTxLibAccess.walletLocalDataStore)
    makeReactNativeIo().then( io => {
        const context = makeContext({
            apiKey: '0b5776a91bf409ac10a3fe5f3944bf50417209a0',
            io
        })
        console.log('io is: ', io)
        abcTxLibAccess.io = io
        let mk = TxLibBTC.createMasterKeys('shitcoin')
        let options = {
            walletType: "shitcoin",
            masterPrivateKey: mk.masterPrivateKey,
            masterPublicKey: mk.masterPublicKey
        }
        console.log('mk: ', mk)
        dispatch(addAirbitzToRedux(context))
        const account = context.loginWithPassword('bob19', 'Funtimes19')
        BTCEngine = TxLibBTC.makeEngine(abcTxLibAccess, options, callbacks, function(error, abcTxEngine) {
            if (error == null) {
                console.log('success and BTCEngine is: ', BTCEngine)
            }
        })
        return account
    })
    .then(account => {
        console.log('inside second then clause')
        dispatch(addAccountToRedux(account))

        return account
    })
    .then((FakeAccount) => {
    // create a fake wallet, select first wallet
    const walletType = 'wallet.repo.myFakeWalletType'
    const walletKeys = ['MASTER_PRIVATE_KEY', 'MASTER_PUBLIC_KEY']
    const newWalletId = FakeAccount.createWallet(walletType, walletKeys)
        .then(walletId => {
            const newWallet = FakeAccount.getWallet(walletId)
            newWallet.name = 'Original'
            // add wallet to redux, select wallet
            dispatch(addWallet(newWallet, 0))
            dispatch(selectWallet(newWallet.name)) // this part will need to be modified to use an actual id!!
        })
        console.log(BTCEngine)
        BTCEngine.startEngine().then(() => { console.log('blockHeight is: ', BTCEngine.getBlockHeight()) })
    }) 
    return dispatch(disableLoadingScreenVisibility())
}
