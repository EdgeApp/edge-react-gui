// @flow
// globals spec
// import ENV from '../env.json'

type data = {
  walletId: string,
  key: string
}

type wallet = {
  id: string,
  currencyCode: string
}

type sendInfo = {
  amount: number,
  address: string,
  isMax: boolean
}

// type leftDetent = {}

export const helpers = (spec: any) => ({
  closeModal: async (modalName: string, returnValue: string) => {
    const modal = await spec.findComponent(modalName)
    return await modal.props.bridge.resolve(returnValue)
  },
  getWalletListRows: async (walletListName: string): Promise<data> => {
    const walletList = await spec.findComponent(walletListName)
    console.log('walletList', walletList.props.data)
    return walletList.props.data
  },

  longPress: async (walletName: string) => {
    const row = await spec.findComponent(walletName)
    row.props.onPress()
  },

  slideConfirm: async (sliderName: string) => {
    const row = await spec.findComponent(sliderName)
    console.log('SlidingComplete', row.props.onSlidingComplete())
    row.props.onSlidingComplete()
  },

  sendCrypto: async (walletId: string, txConfig: { amount: string, address: string, isMax: Boolean }): Promise<sendInfo> => {
    const sendTx = await spec.findComponent(walletId)
    console.log('sendInfo', sendTx)
    return sendTx.props.GuiMakeSpendInfo
  },

  // EdgeTransaction {
  //   currencyCode: string;
  //   nativeAmount: string;
  //   networkFee: string;
  //   parentNetworkFee?: string;
  //   blockHeight: number;
  //   date: number;
  //   txid: string;
  //   signedTx: string;
  //   ourReceiveAddresses: string[];
  //   deviceDescription?: string;
  //   networkFeeOption?: 'high' | 'standard' | 'low' | 'custom';
  //   requestedCustomFee?: JsonObject;
  //   feeRateUsed?: JsonObject;
  //   spendTargets?: Array<{
  //       readonly currencyCode: string;
  //       readonly memo: string | undefined;
  //       readonly nativeAmount: string;
  //       readonly publicAddress: string;
  //       uniqueIdentifier: string | undefined;
  //   }>;
  selectSwipableRow: async (walletListName: string): Promise<wallet> => {
    const swipeRow = await spec.findComponent(walletListName)
    console.log('swipeRow', swipeRow.props.wallet)
    return swipeRow.props.wallet
  },

  swipeRow: async (walletRow: string) => {
    const row = await spec.findComponent(walletRow)
    console.log('SwipeLeft', row.props.omSwipeLeft)
    return row.props.omSwipeLeft
  }
})

// would filling in the info be a helper or on the spec?
// for(sendTx){
//     await spec.fillIn()
// }
