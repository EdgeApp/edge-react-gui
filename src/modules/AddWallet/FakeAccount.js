const FakeAccount = {
  walletList: [],

  createWallet: function (type, keys,) {
    const newWallet = {
      id: Math.floor(Math.random() * 99999),
      type,
      keys
    }
    this.walletList.push(newWallet)

    return Promise.resolve(newWallet.id)
  },

  getWallet: function (id) {
    const wallet = this.walletList.find((wallet) => {
      return wallet.id === id
    })

    return wallet
  }

}

export default FakeAccount
