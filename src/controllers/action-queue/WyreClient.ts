import { asArray, asObject, asOptional, asString } from 'cleaners'
import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

// @ts-expect-error
import ENV from '../../../env'

type WyreClientOptions = {
  account: EdgeAccount
}

type WyreClient = {
  // Properties:
  readonly isAccountSetup: boolean
  // Methods:
  getCryptoPaymentMethod: (wallet: EdgeCurrencyWallet) => Promise<string | undefined>
}

const { baseUri } = ENV.WYRE_CLIENT_INIT

/*
This is an intermediary solution to interface with Wyre until the fiat-plugins
are fully baked.
*/
export const makeWyreClient = async (opt: WyreClientOptions): Promise<WyreClient> => {
  const { account } = opt
  const dataStore = account.dataStore

  //
  // State:
  //

  const wyreSecret = await dataStore
    .getItem('co.edgesecure.wyre', 'wyreSecret')
    .catch(async _ => await dataStore.getItem('co.edgesecure.wyre', 'wyreAccountId'))
  const baseHeaders = {
    Authorization: `Bearer ${wyreSecret}`,
    Accept: 'application/json'
  }
  const isAccountSetup = !!wyreSecret

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

  return {
    // Properties:
    isAccountSetup,

    // Methods:
    async getCryptoPaymentMethod(wallet: EdgeCurrencyWallet): Promise<string | undefined> {
      if (!isAccountSetup) throw new Error('Wyre account not found for EdgeAccount')

      const parentCurrencyCode = wallet.currencyInfo.currencyCode

      const uri = `${baseUri}/v2/paymentMethods`
      const response = await fetch(uri, {
        headers: baseHeaders
      })
      const responseData = await response.text()

      if (!response.ok) {
        handleHttpError(uri, response.status, responseData)
      }

      const { data } = asPaymentMethodsResponse(JSON.parse(responseData))
      const [paymentMethod] = data
      const { blockchains } = paymentMethod

      if (blockchains == null) return

      // Special cases for testnets
      if (parentCurrencyCode === 'MUMBAI') {
        return blockchains.MATIC
      }
      if (parentCurrencyCode === 'TESTBTC') {
        const address = blockchains.BTC
        if (['m', 'n', '2'].includes(address[0])) {
          return address
        }
      }

      return blockchains[parentCurrencyCode]
    }
  }
}

// -----------------------------------------------------------------------------
// Wyre Network Cleaners
// -----------------------------------------------------------------------------

const asPaymentMethodsResponse = asObject({
  data: asArray(
    asObject({
      id: asString,
      // ...some other stuff
      blockchains: asOptional(asObject(asString))
    })
  )
})
