import { FakeWallet } from './index.js'

export class FakeAccount {
  constructor (username, password) {
    this.username = username
    this.password = password
    this.walletList = []
  }

  // async
  checkPassword (password) {
    const isCorrectPassword =
      password === this.password

    return Promise.resolve(isCorrectPassword)
  }

  // sync
  listWalletIds () {
    const walletIds = this.walletList.map(wallet => {
      return wallet.walletId
    })

    return walletIds
  }

  // sync
  getWallet (walletId) {
    const targetWallet = this.walletList.find(wallet => {
      return wallet.walletId === walletId
    })

    return targetWallet
  }

  // sync
  getFirstWallet (walletType) {
    const firstWallet = this.walletList.find(wallet => {
      return wallet.walletType === walletType
    })

    return firstWallet
  }

  // async
  createWallet (walletType, walletKeys, walletName = 'myFakeWallet') {
    const walletId = this.walletList.length
    const newWallet = new FakeWallet(walletType, walletName, walletKeys, walletId)
    const newWalletId = newWallet.walletId
    this.walletList.push(newWallet)

    return Promise.resolve(newWalletId)
  }
}
