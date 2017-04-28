const FakeAccount = {
  walletList: [],

  createWallet: function (type, keys) {
    const newWallet = {
      id: Math.floor(Math.random() * 99999),
      type,
      keys,
      addresses: [
        {
          address: '1_1_PN3opiupq98G4ctfSq8ry3',
          amountReceived: 0,
          used: false
        },
        {
          address: '1_2_PN3opiupq98G4ctfSq8ry3',
          amountReceived: 0,
          used: false
        },
        {
          address: '1_3_PN3opiupq98G4ctfSq8ry3',
          amountReceived: 0,
          used: false
        },
        {
          address: '1_4_PN3opiupq98G4ctfSq8ry3',
          amountReceived: 0,
          used: false
        },
        {
          address: '1_5_PN3opiupq98G4ctfSq8ry3',
          amountReceived: 0,
          used: false
        }
      ],
      getReceiveAddress: function () {
        const receiveAddress = this.addresses.find(address => {
          return (address.amountReceived === 0 && address.used === false)
        })

        return receiveAddress
      },
      lockAddress: function (targetAddress) {
        const addressToLock = this.addresses.find(address => {
          return address.address === targetAddress
        })

        addressToLock.used = true
      }
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
