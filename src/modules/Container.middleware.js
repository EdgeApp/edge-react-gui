import { makeReactNativeIo } from 'react-native-airbitz-io'
import { FakeTxEngine } from '../Fakes/FakeTxEngine.js'
import { addWallet as addWalletUI } from './UI/Wallets/Wallets.action.js'
import { selectWallet as selectWalletUI } from './UI/Wallets/Wallets.action.js'
import { addAccountToRedux, addAirbitzToRedux } from './Login/Login.action.js'
import { makeContext } from 'airbitz-core-js'
import {disableLoadingScreenVisibility} from './Container.action'
import { updatingBalance } from './Transactions/Transactions.action'
import { TxLibBTC, abcTxEngine, abcTxLib } from 'airbitz-txlib-shitcoin'

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
const engineStarted = {}
const ioObject = {}

const abcTxLibAccess = {
  accountDataStore: new ABCDataStore(),
  accountLocalDataStore: new ABCDataStore(),
  walletDataStore: new ABCDataStore(),
  walletLocalDataStore: new ABCDataStore()
}


export const initializeAccount = (dispatch) => {
    console.log('kylan: walletLocalDataStore is: ', abcTxLibAccess.walletLocalDataStore)
    makeReactNativeIo().then( io => {
      ioObject = io
        console.log('kylan: first io is: ', io)
        const context = makeContext({
            apiKey: '0b5776a91bf409ac10a3fe5f3944bf50417209a0',
            io
        })

        dispatch(addAirbitzToRedux(context))
        const account = context.loginWithPassword('bob19', 'Funtimes19')


        return account

    })
    .then((account) => {
      console.log('kylan: second io is: ', ioObject)
      
      dispatch(addAccountToRedux(account))

    return account
  })
    .then((account) => {
      console.log('kylan: third io is: ', ioObject)
      const walletIds = account.listWalletIds()
      const wallets = walletIds.map(id => {
        wallet = account.getWallet(id)
        wallet.id = id
        wallet.name = 'myFakeWallet - ' + id.slice(0, 5)     

        return wallet
      })

      wallets.slice(0,1).forEach((wallet) => {
        dispatch(addWalletUI(wallet, wallets.length))

        abcTxLibAccess.io = ioObject
        console.log('kylan: TxLibBTC is: ', TxLibBTC, ' , io is : ', ioObject)
        let mk = TxLibBTC.createMasterKeys(ioObject, 'shitcoin')
        console.log('kylan: mk: ', mk)
        let options = {
            walletType: "shitcoin",
            masterPrivateKey: mk.masterPrivateKey,
            masterPublicKey: mk.masterPublicKey
        }
        const callbacks = {
            addressesChecked ( ...rest) {
              console.log('kylan: addressesChecked', rest)
              if(rest[0] === 1) {
                console.log('kylan: addresses done checking')
                dispatch(updatingBalance('DISABLE'))
                console.log('kylan: address done checking and BTCEngine is: ', BTCEngine)
                let currentBalance = BTCEngine.getBalance()
                console.log('kylan: shitcoin balance is: ', currentBalance )
              }
            },
            transactionsChanged ( ...rest) {
              // core will cache previous transactions, should have trigger for updating UI and re-do getTransactions(). Start off with a getTransactions()
            console.log('kylan: transactionsChanged', rest)
            },
            blockHeightChanged ( ...rest) {
            console.log('kylan: blockHeightChanged', rest) // will also trigger transactionsChanged if that is the case.
            }
        }
        console.log('kylan: TxLibBTC is: ', TxLibBTC, ' , io is : ', ioObject)
        console.log('kylan: about to makeEngine')
        let BTCEngine = TxLibBTC.makeEngine(abcTxLibAccess, options, callbacks)
        console.log('kylan: after BTCEngine')   
        BTCEngine.startEngine()
      })
    })
  return dispatch(disableLoadingScreenVisibility())

}
