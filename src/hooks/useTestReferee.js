// // @flow
// // globals spec
// // import ENV from '../env.json'

// import stringify from 'csv-stringify'

// type data = Array<{
//   walletId: string,
//   id: string,
//   fullCurrencyCode?: string,
//   key: string
// }>

// type sendInfo = {
//   amount: number,
//   address: stringify,
//   isMax: boolean
// }

// export const helpers = (spec: any) => ({
//   resolveModal: async (modalName: string, returnValue: string) => {
//     const modal = await spec.findComponent(modalName)
//     return await modal.props.bridge.resolve(returnValue)
//   },
//   getWalletListCodes: async (walletListName: string): Promise<data> => {
//     const walletList = await spec.findComponent(walletListName)
//     console.log('walletList', walletList)
//     return walletList.props.data
//   },

//   longPress: async (walletName: string) => {
//     const row = await spec.findComponent(walletName)
//     row.props.onPress()
//   },

//   swipeRow: async (walletRow: string) => {
//     const row = await spec.findComponent(walletRow)
//     row.props.onPress()
//   },

//   slideConfirm: async () => {},

//   sendCrypto: async (walletId: stringify): Promise<sendInfo> => {
//     const sendTx = await spec.findComponent(walletId)
//     console.log('sendInfo', sendTx)
//     return sendTx.props.GuiMakeSpendInfo
//   }
// })

// @flow

import { useCavy } from 'cavy'
import { createContext } from 'react'

import { useContext, useEffect } from '../types/reactHooks.js'

export type TestReferee = (idOrComponent: string | any) => TestReferee | string

export const makeTestReferee = (generateTestHook: (id: string, ref?: any) => (ref: any) => any, id: string): TestReferee => {
  let scope = id
  const testReferee: TestReferee = idOrComponent => {
    if (typeof idOrComponent === 'string') {
      scope = `${id}.${idOrComponent}`
      return testReferee
    }
    return generateTestHook(scope)(idOrComponent)
  }
  return testReferee
}

const TestRefereeContext = createContext<{ currentTestReferee: TestReferee | null }>({
  currentTestReferee: null
})

export const useTestReferee = (id: string) => {
  const generateTestHook = useCavy()
  const ctx = useContext(TestRefereeContext)

  const parentTestReferee = ctx.currentTestReferee
  const testReferee: TestReferee = parentTestReferee != null ? (parentTestReferee(id): any) : makeTestReferee(generateTestHook, id)

  // Set currentTestReferee to testReferee for child components
  ctx.currentTestReferee = testReferee

  // componentDidMount
  useEffect(() => {
    // Revert testReferee to parentTestReferee
    ctx.currentTestReferee = parentTestReferee
  }, [ctx, parentTestReferee])

  return testReferee
}

// // would filling in the info be a helper or on the spec?
// for(sendTx){
//     await spec.fillIn()
// }

// // @flow

// import { useCavy } from 'cavy'

// export type TestReferee = (idOrComponent: string | any) => TestReferee | string

// export const makeTestReferee = (generateTestHook: (id: string, ref?: any) => (ref: any) => any, id: string): TestReferee => {
//   let scope = id
//   const testReferee: TestReferee = idOrComponent => {
//     if (typeof idOrComponent === 'string') {
//       scope = `${id}.${idOrComponent}`
//       return testReferee
//     }
//     return generateTestHook(scope)(idOrComponent)
//   }
//   return testReferee
// }

// export const useTestReferee = (id: string) => {
//   const generateTestHook = useCavy()
//   const testReferee = makeTestReferee(generateTestHook, id)
//   return testReferee
// }
