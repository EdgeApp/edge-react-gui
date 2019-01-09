// @flow

import type { EdgeReceiveAddress, EdgeTransaction } from 'edge-core-js'
import { Linking } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { SEND_CONFIRMATION } from '../../../../constants/SceneKeys.js'
import { type GuiMakeSpendInfo } from '../../../../reducers/scenes/SendConfirmationReducer.js'
import * as WALLET_API from '../../../Core/Wallets/api'

const formatWallet = w => {
  if (!w) return
  return {
    id: w.id,
    name: w.name,
    type: w.type,
    currencyCode: w.currencyCode ? w.currencyCode : w.currencyInfo.currencyCode,
    primaryNativeBalance: w.primaryNativeBalance,
    fiatCurrencyCode: w.fiatCurrencyCode
  }
}

type Context = any
type Wallet = any
type Wallets = Array<Wallet>
type Address = {
  encodeUri: string,
  address: EdgeReceiveAddress
}

// TODO: either get rid of PluginBridge class or refactor out these globals
let navStack: Array<string> = []
let _context: Context = null

export function pop (): any {
  navStack.pop()
  if (navStack.length === 0) {
    Actions.pop()
  } else {
    if (_context) {
      _context.back()
    }
  }
}

export class PluginBridge {
  context: Context

  constructor (context: Context) {
    _context = this.context = context
    // reset navstack
    navStack = []
  }

  componentDidMount () {
    Actions.refresh({
      leftTitle: 'Back'
    })
  }

  bitidAddress (): Promise<string> {
    // TODO: not supported by core...yet
    return Promise.reject(new Error('not implemented'))
  }

  bitidSignature (): Promise<string> {
    // TODO: not supported by core...yet
    // const {uri, message} = data
    return Promise.reject(new Error('not implemented'))
  }

  chooseWallet (obj: { cbid: string, func: string, id: string, currencyCode: string }): Promise<any> {
    this.context.chooseWallet(obj.id, obj.currencyCode)
    return Promise.resolve(null)
  }

  changeWallet (): Promise<any> {
    this.context.toggleWalletList()
    return Promise.resolve(null)
  }

  selectedWallet (): Promise<Wallet> {
    return Promise.resolve(formatWallet(this.context.wallet))
  }

  wallets (): Promise<Wallets> {
    console.log(this.context.wallets)
    const wallets = Object.keys(this.context.wallets).map(key => formatWallet(this.context.wallets[key]))
    return Promise.resolve(wallets)
  }

  async getAddress (data: any): Promise<Address> {
    const walletId = data.walletId
    const coreWallet = this.context.coreWallets[walletId]
    const currencyCode = data.currencyCode
    const address = await WALLET_API.getReceiveAddress(coreWallet, currencyCode)
    const encodeUri = await coreWallet.encodeUri(address)
    return { encodeUri, address }
  }

  finalizeReceiveRequest (data: any): Promise<boolean> {
    // const {coreWallet, receiveAddress} = data
    return Promise.reject(new Error('not implemented'))
  }

  _spend (guiMakeSpendInfo: GuiMakeSpendInfo, lockInputs: boolean = true, signOnly: boolean = false): Promise<EdgeTransaction> {
    return new Promise((resolve, reject) => {
      if (signOnly) {
        reject(new Error('not implemented'))
      }
      guiMakeSpendInfo.onDone = (error: Error | null, edgeTransaction?: EdgeTransaction) => {
        error ? reject(error) : resolve(edgeTransaction)
      }
      guiMakeSpendInfo.lockInputs = true
      Actions[SEND_CONFIRMATION]({ guiMakeSpendInfo })
    })
  }

  //
  // // Example use of makeSpendRequest
  //
  // const guiMakeSpendInfo: GuiMakeSpendInfo = {
  //   spendTargets: [
  //     {
  //       publicAddress: '1xfoi24t98uaweifuha4t98aweifuy',
  //       nativeAmount: '123456789'
  //     },
  //     {
  //       publicAddress: '3f0923498t7euiyf982398r7fiuyrr',
  //       nativeAmount: '345678912'
  //     }
  //   ],
  //   signOnly: false, // Default is false. True is unimplemented
  //   lockInputs: true
  // }

  // try {
  //   const edgeTransaction = await makeSpendRequest(guiMakeSpendInfo)
  // } catch (e) {
  //   console.log(e)
  // }

  async makeSpendRequest (guiMakeSpendInfo: GuiMakeSpendInfo): Promise<EdgeTransaction> {
    const edgeTransaction = await this._spend(guiMakeSpendInfo)
    console.log('Plugin successfully sent transaction')
    console.log(edgeTransaction)
    return edgeTransaction
  }

  // async requestSign (guiMakeSpendInfo: GuiMakeSpendInfo): Promise<EdgeTransaction> {
  //   const guiMakeSpendInfo: GuiMakeSpendInfo = {
  //     spendTargets,
  //     signOnly: true
  //   }
  //   const edgeTransaction = await this._spend(guiMakeSpendInfo)
  //   console.log('Plugin successfully signed transaction')
  //   console.log(edgeTransaction)
  //   return edgeTransaction
  // }

  broadcastTx (data: any): Promise<EdgeTransaction> {
    throw new Error('ErrorUnimplemented')
    // const { coreWallet, rawtx } = data
    // return WALLET_API.broadcastTransaction(coreWallet, rawtx)
  }

  saveTx (data: any): Promise<EdgeTransaction> {
    throw new Error('ErrorUnimplemented')
    // const { coreWallet, signedTransaction } = data
    // return WALLET_API.signTransaction(coreWallet, signedTransaction)
  }

  requestFile (): Promise<string> {
    // TODO
    // const {options} = data
    return Promise.reject(new Error('not implemented'))
  }

  readData = async (data: any): Promise<string> => {
    try {
      const response = await this.context.folder.getItem(this.context.pluginId, data.key)
      console.log('LOGGING readData response is: ', response)
      return response
    } catch (e) {
      console.log('LOGGING error with readData: ', e)
      throw new Error(e)
    }
  }

  writeData = async (data: any): Promise<boolean> => {
    const { key, value } = data
    try {
      console.log('LOGGING about to write data with key: ', key, ' and value: ', value)
      await this.context.folder.setItem(this.context.pluginId, key, value)
      console.log('LOGGING successfully written data and returning true')
      return true
    } catch (e) {
      console.log('LOGGING writeData error: ', e)
      return false
    }
  }

  clearData (): Promise<boolean> {
    return this.context.folder.deletePlugin(this.context.pluginId).then(() => {
      return true
    })
  }

  getAffiliateInfo (): Promise<any> {
    return Promise.reject(new Error('not implemented'))
  }

  get (data: any): Promise<string> {
    const { key } = data
    if (this.context.plugin.environment[key]) {
      return Promise.resolve(this.context.plugin.environment[key])
    } else {
      return Promise.reject(new Error(`${key} is not valid for plugin`))
    }
  }

  debugLevel (data: any): Promise<boolean> {
    console.log(`LOGGING ${this.context.plugin.key}  ${data.level}: ${data.text}`)
    return Promise.resolve(true)
  }

  showAlert (data: any): Promise<boolean> {
    this.context.showAlert({ success: data['success'], title: data['title'], message: data['message'] })
    return Promise.resolve(true)
  }

  hideAlert (): Promise<boolean> {
    return Promise.reject(new Error('not implemented'))
  }

  title (data: any): Promise<boolean> {
    const { title } = data
    this.context.renderTitle(title)
    return Promise.resolve(true)
  }

  back (): Promise<boolean> {
    pop()
    return Promise.resolve(true)
  }

  exit (): Promise<boolean> {
    Actions.pop()
    return Promise.resolve(true)
  }

  launchExternal (data: any): Promise<any> {
    return Linking.openURL(data.uri)
  }

  navStackClear (): Promise<boolean> {
    navStack = []
    return Promise.resolve(true)
  }

  navStackPush (data: any): Promise<boolean> {
    navStack.push(data.path)
    return Promise.resolve(true)
  }

  navStackPop (): Promise<string> {
    const path = navStack.pop()
    return Promise.resolve(path)
  }
}
