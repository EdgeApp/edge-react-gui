// @flow
// globals spec
// import ENV from '../env.json'
// import { asString, asValue } from 'cleaners'
import { DocumentDirectoryPath } from 'react-native-fs'
import { captureScreen } from 'react-native-view-shot'

type data = {
  walletId: string,
  key: string
}

type wallet = {
  id: string,
  currencyCode: string
}

type walletData = {
  currencyName: string,
  walletType: string,
  pluginId: string,
  currencyCode: string
}
type sendInfo = {
  amount: number,
  address: string,
  isMax: boolean
}
type fiatList = {
  value: string,
  label: string
}

// 3. finish nav spec with snapshots
// // in some places the snapShot helper function fails but spec.press works

// 4. write a script to copy all snapshot images at end of test.. to snapshot folder
// add flag

// 5. make ckeaner asString('walletName') !== asString('newWalletName')
// to compare wallet names before and after

// 6. HelpModal refactor

// 7. settingActions

export const helper = (spec: any, help: any) => ({
  // generic util function

  checkWalletName: async (walletName: string) => {
    const orginWalletName = 'myWallet'
    const changeWalletName = await spec.findComponent(walletName)
    console.log('walletNameText', walletName)
    // let changeWalletName = await spec.exists(walletName)
    if (orginWalletName === changeWalletName) {
      throw new Error('wrong, wallet names are the same')
    }
  },

  snapShot: async (componentName: string, time?: number = 1000) => {
    await spec.press(componentName)
    await spec.pause(time)
    await captureScreen({
      snapshotContentContainer: false,
      path: `${DocumentDirectoryPath}/${componentName}snapShots.jpg`,
      result: 'file',
      format: 'jpg',
      quality: 0.8
    })
    console.log('DocumentDirectoryPath', DocumentDirectoryPath)
  },

  closeModal: async (modalName: string, returnValue: string) => {
    const modal = await spec.findComponent(modalName)
    return await modal.props.bridge.resolve(returnValue)
  },
  getWalletListRows: async (walletListName: string): Promise<data> => {
    const walletList = await spec.findComponent(walletListName)
    console.log('walletList', walletList.props.data)
    return walletList.props.data
  },
  getWalletListData: async (walletListName: string): Promise<walletData> => {
    const walletList = await spec.findComponent(walletListName)
    // walletList.scrollToIndex({ animated: true, index: 20 })
    console.log('codes', walletList.props.data)
    return walletList.props.data
  },
  getfiatList: async (currencyListName: string): Promise<fiatList> => {
    const fiatList = await spec.findComponent(currencyListName)
    console.log('fiatList', fiatList.props.data)
    return fiatList.props.data
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
