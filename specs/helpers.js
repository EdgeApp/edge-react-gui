// @flow
// globals spec
// import ENV from '../env.json'

import { DocumentDirectoryPath } from 'react-native-fs'
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
  key: string
}

export const helpers = (spec: any) => ({
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
    console.log('codes', walletList.props.data)
    return walletList.props.data
  },
  navigate: async (fromName: string, toName: string, time?: number = 1000) => {
    const currentTime = Date.now()
    const destinationName = `${fromName}.${toName}`
    await spec.press(destinationName)
    await spec.pause(time)
    await captureScreen({
      snapshotContentContainer: false,
      path: `${DocumentDirectoryPath}/${currentTime}.${destinationName}.snap.jpg`,
      result: 'file',
      format: 'jpg',
      quality: 0.8
    })
    console.log('Saved Snap Shot', `${DocumentDirectoryPath}/${currentTime}.${destinationName}.snap.jpg`)
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
