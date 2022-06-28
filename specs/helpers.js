// @flow
// globals spec
// import ENV from '../env.json'

// import { DocumentDirectoryPath, mkdir } from 'react-native-fs'
// import { captureScreen } from 'react-native-view-shot'
type fiatList = {
  value: string,
  label: string
}

type walletData = {
  currencyName: string,
  walletType: string,
  pluginId: string,
  currencyCode: string
}
type data = {
  walletId: string,
  key: string,
  name: string,
  wallet: { string: any }
}

// const SnapShotsPath = `${DocumentDirectoryPath}/__snapshots__`

export const helpers = (spec: any) => ({
  longPress: async (walletName: string) => {
    const row = await spec.findComponent(walletName)
    row.props.onLongPress()
  },
  resolveModal: async (modalName: string, returnValue: string) => {
    const modal = await spec.findComponent(modalName)
    return await modal.props.bridge.resolve(returnValue)
  },
  getFiatList: async (currencyListName: string): Promise<fiatList> => {
    const fiatList = await spec.findComponent(currencyListName)
    return fiatList.props.data
  },
  getWalletListRows: async (walletListName: string): Promise<data> => {
    const walletList = await spec.findComponent(walletListName)
    return walletList.props.data
  },
  getWalletListCodes: async (walletListName: string): Promise<data> => {
    const walletList = await spec.findComponent(walletListName)

    return walletList.props.data
  },
  getWalletListData: async (walletListName: string): Promise<walletData> => {
    const walletList = await spec.findComponent(walletListName)
    return walletList.props.data
  },

  getWalletNameValue: async (walletName: string): Promise<data> => {
    const walletNameModal = await spec.findComponent(walletName)
    return walletNameModal.props.data[0].wallet.name
  },

  scrollToLastItem: async (walletListName: any) => {
    // Get Last item name, call it lastRowName
    try {
      const lastRow = await spec.findComponent(walletListName)
      console.log('lastRow', lastRow.props.data)
      const lastRowName = walletListName.length - 1
      console.log('lastRowName', lastRowName)
      await lastRow.scrollToEnd()

      return lastRowName.props.data
    } catch (e) {
      spec.pause(1000)
      walletListName.scrollToEnd()
      console.log('e', e)
    }
  },

  scrollWalletList: async (walletListName: string): Promise<data> => {
    const walletList = await spec.findComponent(walletListName)
    // walletList.scrollToIndex({ animated: true, index: 15 })
    // for (let i = 0; i < walletList.length; i++) {
    // setinterval doesnt work well with async b/c it doesn't return a promise
    // use the coding file matt showed while true
    await setInterval(walletList.scrollToEnd({ animated: true, index: -1 }), 1000)
    // if (walletList.lastIndexOf(walletList.props.data.walletId)) {
    // stop interval
    // } snooze in utils
    // walletList.scrollToEnd()
    // await spec.pause(1000)
    // walletList.scrollToEnd({ animated: true, index: -1 })
    // await spec.pause(1000)
    // walletList.scrollToEnd({ animated: true, index: -1 })
    // scroll loop that goes until it gets to the end
    // create a loop to get
    // }
    console.log('walletList', walletList.props.data)
    return walletList.props.data
  },

  //   navigate: async (fromName: string, toName: string, time?: number = 1000) => {
  //     try {
  //       await mkdir(SnapShotsPath)
  //     } catch (err) {}

  //     const currentTime = Date.now()
  //     const destinationName = `${fromName}.${toName}`
  //     const snapshotFilePath = `${SnapShotsPath}/${currentTime}:${destinationName}.snap.jpg`
  //     await spec.press(destinationName)
  //     await spec.pause(time)
  //     await captureScreen({
  //       snapshotContentContainer: false,
  //       path: snapshotFilePath,
  //       result: 'file',
  //       format: 'jpg',
  //       quality: 0.8
  //     })
  //     console.log('Saved Snap Shot', snapshotFilePath)
  //   },

  closeModal: async (modalName: string, time?: number = 1000) => {
    await spec.press(`${modalName}.Close`)
    await spec.pause(time)
  },
  navigateBack: async (sceneName: string, time?: number = 1000) => {
    await spec.press(`${sceneName}.Back`)
    await spec.pause(time)
  }
})
