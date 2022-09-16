// @flow

import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'
import { type EdgeAccount } from 'edge-core-js'

import ENV from '../../../env'

export type PaymentMethod = {
  id: string,
  name: string,
  defaultCurrency: string,
  status: string,
  supportsDeposit: boolean,
  supportsPayment: boolean,
  blockchains: { [string]: string }
}

type WyreClientOptions = {
  account: EdgeAccount
}

type WyreClient = {
  +isAccountSetup: boolean,
  getPaymentMethods(): Promise<{ [string]: PaymentMethod } | void>,
  getCryptoPaymentAddress(fiatAccountId: string, walletId: string): Promise<string>
}

const { baseUri } = ENV.WYRE_CLIENT_INIT

export const makeWyreClient = async (opt: WyreClientOptions): Promise<WyreClient> => {
  const { account } = opt
  const dataStore = account.dataStore

  //
  // State:
  //

  const wyreSecret = await dataStore.getItem('co.edgesecure.wyre', 'wyreSecret').catch(_ => dataStore.getItem('co.edgesecure.wyre', 'wyreAccountId'))
  const isAccountSetup = !!wyreSecret

  const baseHeaders = {
    Authorization: `Bearer ${wyreSecret}`,
    Accept: 'application/json'
  }

  //
  // Private methods:
  //

  const handleHttpError = (requestUri: string, responseStatus: number, responseData: string) => {
    console.info(`Failed HTTP exchange-sell response: ${responseData}`)
    throw new Error(`Request to ${requestUri} failed with HTTP ${responseStatus}`)
  }

  //
  // Public
  //

  const instance = {
    // Properties:
    isAccountSetup,

    // Methods:
    async getPaymentMethods(): Promise<{ [string]: PaymentMethod } | void> {
      if (!isAccountSetup) throw new Error('Wyre account not found for EdgeAccount')

      const uri = `${baseUri}/v2/paymentMethods`
      const response = await fetch(uri, {
        headers: baseHeaders
      })
      const responseData = await response.text()

      if (!response.ok) {
        handleHttpError(uri, response.status, responseData)
      }
      if (response.status === 204) {
        return
      }

      const { data: paymentMethodsResponse } = asPaymentMethodsResponse(JSON.parse(responseData))

      const paymentMethodsMap: { [string]: PaymentMethod } = {}
      paymentMethodsResponse.forEach(paymentMethod => {
        const { blockchains, id } = paymentMethod
        if (blockchains == null) return

        // Special cases for testnets, if they don't yet support (they currently do not)
        if (blockchains.MUMBAI == null) blockchains.MUMBAI = blockchains.MATIC
        if (blockchains.TESTBTC == null) {
          const address = blockchains.BTC
          if (['m', 'n', '2'].includes(address[0])) blockchains.TESTBTC = address
        }
        paymentMethod.blockchains = blockchains

        paymentMethodsMap[id] = paymentMethod
      })

      return paymentMethodsMap
    },

    async getCryptoPaymentAddress(fiatAccountId: string, walletId: string): Promise<string> {
      const paymentMethods = await instance.getPaymentMethods()
      const paymentMethod = paymentMethods != null ? paymentMethods[fiatAccountId] : undefined
      if (paymentMethod == null) throw new Error(`Could not find fiat-sell accountId ${fiatAccountId}`)

      const { blockchains } = paymentMethod
      const wallet = account.currencyWallets[walletId]
      const parentCode = wallet.currencyInfo.currencyCode
      if (!(parentCode in blockchains)) throw new Error(`No fiat-sell support for ${wallet.type} network assets on wyreAccountId ${fiatAccountId}`)
      const address = blockchains[parentCode]

      return address
    }
  }

  return instance
}

// -----------------------------------------------------------------------------
// Wyre Network Cleaners
// -----------------------------------------------------------------------------

const asPaymentMethodsResponse = asObject({
  data: asArray<PaymentMethod>(
    asObject({
      id: asString,
      name: asString,
      defaultCurrency: asString,
      status: asString,
      supportsDeposit: asBoolean,
      supportsPayment: asBoolean,
      blockchains: asOptional(asObject(asString), {})
    })
  )
})
