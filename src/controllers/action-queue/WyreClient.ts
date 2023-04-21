import { asArray, asBoolean, asObject, asOptional, asString } from 'cleaners'
import { EdgeAccount } from 'edge-core-js'

import { ENV } from '../../env'

export interface PaymentMethod {
  id: string
  name: string
  defaultCurrency: string
  status: string
  supportsDeposit: boolean
  supportsPayment: boolean
  blockchains: { [key: string]: string }
}

export interface PaymentMethodsMap {
  [key: string]: PaymentMethod
}

interface WyreClientOptions {
  account: EdgeAccount
}

interface WyreClient {
  readonly isAccountSetup: boolean
  getPaymentMethods: () => Promise<PaymentMethodsMap>
  getCryptoPaymentAddress: (wyreAccountId: string, walletId: string) => Promise<string>
}

const { baseUri } = ENV.WYRE_CLIENT_INIT

// Deprecated: Create generic "fiat ramp API" for future fiat on/off-ramp partner
export const makeWyreClient = async (opt: WyreClientOptions): Promise<WyreClient> => {
  const { account } = opt
  const dataStore = account.dataStore

  // #region State

  const wyreSecret = await dataStore
    .getItem('co.edgesecure.wyre', 'wyreSecret')
    .catch(async _ => await dataStore.getItem('co.edgesecure.wyre', 'wyreAccountId'))
    .catch(_ => undefined)
  const isAccountSetup = !!wyreSecret

  const baseHeaders = {
    Authorization: `Bearer ${wyreSecret}`,
    Accept: 'application/json'
  }

  // #endregion State

  // #region Private Methods

  const handleHttpError = (requestUri: string, responseStatus: number, responseData: string) => {
    console.info(`Failed HTTP exchange-sell response: ${responseData}`)
    throw new Error(`Request to ${requestUri} failed with HTTP ${responseStatus}`)
  }

  // #endregion Private Methods

  //
  // Public
  //

  const instance = {
    // Properties:
    isAccountSetup,

    // Methods:
    async getPaymentMethods(): Promise<PaymentMethodsMap> {
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
        return {}
      }

      const { data: paymentMethodsResponse } = asPaymentMethodsResponse(JSON.parse(responseData))

      const paymentMethodsMap: PaymentMethodsMap = {}
      paymentMethodsResponse.forEach(paymentMethod => {
        const { blockchains, id } = paymentMethod
        if (blockchains == null) return
        if (paymentMethod.status !== 'ACTIVE') return

        // Special cases for testnets, if they don't yet support (they currently do not)
        if (blockchains.MUMBAI == null && blockchains.MATIC != null) blockchains.MUMBAI = blockchains.MATIC
        if (blockchains.TESTBTC == null) {
          const address = blockchains.BTC
          if (address != null && ['m', 'n', '2'].includes(address[0])) blockchains.TESTBTC = address
        }
        paymentMethod.blockchains = blockchains

        paymentMethodsMap[id] = paymentMethod
      })

      return paymentMethodsMap
    },

    async getCryptoPaymentAddress(wyreAccountId: string, walletId: string): Promise<string> {
      const paymentMethods = await instance.getPaymentMethods()
      const paymentMethod = paymentMethods != null ? paymentMethods[wyreAccountId] : undefined
      if (paymentMethod == null) throw new Error(`Could not find wyre-sell accountId ${wyreAccountId}`)

      const { blockchains } = paymentMethod
      const wallet = account.currencyWallets[walletId]
      const parentCode = wallet.currencyInfo.currencyCode
      if (!(parentCode in blockchains)) throw new Error(`No wyre-sell support for ${wallet.type} network assets on wyreAccountId ${wyreAccountId}`)
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
      blockchains: asOptional(asObject(asString), () => ({}))
    })
  )
})
