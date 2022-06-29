// @flow
// globals spec
// import ENV from '../env.json'

import { DocumentDirectoryPath, mkdir } from 'react-native-fs'
import { captureScreen } from 'react-native-view-shot'
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
  wallet: { name: string },
  id: string
}

type walletNameData = {
  children: string,
  wallet: { name: string }
}

const SnapShotsPath = `${DocumentDirectoryPath}/__snapshots__`

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

  getWalletNameValue: async (renameWallet: string): Promise<walletNameData> => {
    const walletNameModal = await spec.findComponent(renameWallet)
    console.log('getWalletNameValue', walletNameModal.props.children.length)
    return walletNameModal.props.children.length
  },
  checkWalletNameValue: async (renameWallet: string): Promise<walletNameData> => {
    const walletNameModal = await spec.findComponent(renameWallet)
    console.log('checkWalletNameValue', walletNameModal.props.wallet.name)
    return walletNameModal.props.wallet.name
  },
  getWalletName: async (walletName: string): Promise<data> => {
    const walletNameModal = await spec.findComponent(walletName)
    console.log('getWalletName', walletNameModal.props.wallet)

    return walletNameModal.props.wallet
  },
  navigate: async (fromName: string, toName: string, time?: number = 1000) => {
    try {
      await mkdir(SnapShotsPath)
    } catch (err) {}

    const currentTime = Date.now()
    const destinationName = `${fromName}.${toName}`
    const snapshotFilePath = `${SnapShotsPath}/${currentTime}:${destinationName}.snap.jpg`
    await spec.press(destinationName)
    await spec.pause(time)
    await captureScreen({
      snapshotContentContainer: false,
      path: snapshotFilePath,
      result: 'file',
      format: 'jpg',
      quality: 0.8
    })
    console.log('Saved Snap Shot', snapshotFilePath)
  },

  closeModal: async (modalName: string, time?: number = 1000) => {
    await spec.press(`${modalName}.Close`)
    await spec.pause(time)
  },
  navigateBack: async (sceneName: string, time?: number = 1000) => {
    await spec.press(`${sceneName}.Back`)
    await spec.pause(time)
  }
})
