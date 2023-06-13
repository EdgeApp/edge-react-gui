import { div, mul } from 'biggystring'
import {
  asArray,
  asBoolean,
  asCodec,
  asDate,
  asEither,
  asJSON,
  asMaybe,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue,
  Cleaner,
  uncleaner
} from 'cleaners'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { lstrings } from '../../../locales/strings'
import { wasBase64 } from '../../../util/cleaners/asBase64'
import { cleanFetch, fetcherWithOptions } from '../../../util/cleanFetch'
import { toBigNumberString } from '../../../util/toBigNumberString'
import { makeUuid } from '../../../util/utils'
import { FiatProvider, FiatProviderAssetMap, FiatProviderFactory, FiatProviderGetQuoteParams, FiatProviderQuote } from '../fiatProviderTypes'
import { RewardsCardItem, UserRewardsCards } from '../RewardsCardPlugin'

// JWT 24 hour access token for Edge
let ACCESS_TOKEN: string

const ONE_MINUTE = 1000 * 60
const RATE_QUOTE_CARD_AMOUNT = 500
const HARD_CURRENCY_PRECISION = 8
const MAX_FIAT_CARD_PURCHASE_AMOUNT = 1000
const MIN_FIAT_CARD_PURCHASE_AMOUNT = 10

const ioniaBaseRequestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}

const asIoniaPluginApiKeys = asObject({
  clientId: asString,
  clientSecret: asString,
  ioniaBaseUrl: asString,
  merchantId: asNumber,
  scope: asString
})

export const asRewardsCard = asCodec<RewardsCardItem>(
  raw => {
    const ioniaCard = asObject({
      Id: asNumber,
      ActualAmount: asOptional(asNumber),
      CardNumber: asString,
      CreatedDate: asDate,
      Currency: asOptional(asString)
    })(raw)

    const purchaseAsset = ioniaCard.Currency
    const amount = ioniaCard.ActualAmount
    // Expires 6 calendar months from the creation date
    const expirationDate = new Date(ioniaCard.CreatedDate.valueOf())
    expirationDate.setMonth(ioniaCard.CreatedDate.getMonth() + 6)

    return {
      id: ioniaCard.Id,
      creationDate: ioniaCard.CreatedDate,
      expirationDate,
      amount,
      purchaseAsset,
      url: ioniaCard.CardNumber
    }
  },
  rewardCard => ({
    Id: rewardCard.id,
    ActualAmount: rewardCard.amount,
    CardNumber: rewardCard.url,
    CreatedDate: rewardCard.creationDate,
    Currency: rewardCard.purchaseAsset
  })
)

export type IoniaPurchaseCard = ReturnType<typeof asIoniaPurchaseCard>
export const asIoniaPurchaseCard = asObject({
  paymentId: asString,
  order_id: asString,
  uri: asString,
  currency: asString,
  amount: asNumber,
  status: asValue('PENDING'),
  success: asBoolean,
  userId: asNumber
})

const asIoniaResponse = <Data extends any>(asData: Cleaner<Data>) =>
  asObject({
    Data: asData,
    Successful: asBoolean,
    ErrorMessage: asString
  })

const asStoreHiddenCards = asOptional(asJSON(asArray(asNumber)), [])
const wasStoreHiddenCards = uncleaner(asStoreHiddenCards)

export interface IoniaMethods {
  authenticate: (shouldCreate?: boolean) => Promise<boolean>
  getRewardsCards: () => Promise<UserRewardsCards>
  hideCard: (cardId: number) => Promise<void>
  queryPurchaseCard: (currencyCode: string, cardAmount: number) => Promise<IoniaPurchaseCard>
}

export const makeIoniaProvider: FiatProviderFactory<IoniaMethods> = {
  providerId: 'ionia',
  storeId: 'ionia',
  async makeProvider(params) {
    const { store } = params.io
    const pluginKeys = asIoniaPluginApiKeys(params.apiKeys)

    const STORE_USERNAME_KEY = `${pluginKeys.scope}:userName`
    const STORE_EMAIL_KEY = `${pluginKeys.scope}:uuidEmail`
    const STORE_HIDDEN_CARDS_KEY = `${pluginKeys.scope}:hiddenCards`

    //
    // Fetch API
    //

    // OAuth Access Token Request:
    const fetchAccessToken = cleanFetch({
      resource: `https://auth.craypay.com/connect/token`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      },
      asRequest: asOptional(asString, `grant_type=client_credentials&scope=${pluginKeys.scope}`),
      asResponse: asJSON(
        asObject({
          access_token: asString,
          expires_in: asNumber,
          token_type: asString,
          scope: asString
        })
      )
    })

    // Ionia Create User:
    const fetchCreateUserBase = cleanFetch({
      resource: `${pluginKeys.ioniaBaseUrl}/CreateUser`,
      options: ioniaBaseRequestOptions,
      asRequest: asJSON(
        asObject({
          requestedUUID: asString,
          Email: asString
        })
      ),
      asResponse: asJSON(
        asIoniaResponse(
          asEither(
            asNull,
            asObject({
              UserName: asString,
              ErrorMessage: asEither(asNull, asString)
            })
          )
        )
      )
    })

    // Ionia Get Gift Cards:
    const fetchGetGiftCardsBase = cleanFetch({
      resource: `${pluginKeys.ioniaBaseUrl}/GetGiftCards`,
      options: ioniaBaseRequestOptions,
      asRequest: asJSON(
        asOptional(
          asEither(
            asObject({}),
            asObject({
              Id: asNumber
            })
          ),
          {}
        )
      ),
      asResponse: asJSON(asIoniaResponse(asArray(asRewardsCard)))
    })

    // Ionia Purchase Card Request:
    const fetchPurchaseGiftCardBase = cleanFetch({
      resource: `${pluginKeys.ioniaBaseUrl}/PurchaseGiftCard`,
      options: ioniaBaseRequestOptions,
      asRequest: asJSON(
        asObject({
          MerchantId: asNumber,
          Amount: asNumber,
          Currency: asString
        })
      ),
      asResponse: asJSON(asIoniaResponse(asMaybe(asIoniaPurchaseCard)))
    })

    // Payment Protocol Request Payment Options:
    const fetchPaymentOptions = cleanFetch({
      resource: input => input.endpoint,
      asResponse: asJSON(
        asObject({
          time: asString,
          expires: asString,
          memo: asString,
          paymentUrl: asString,
          paymentId: asString,
          paymentOptions: asArray(
            asObject({
              currency: asString,
              chain: asString,
              network: asString,
              estimatedAmount: asNumber,
              requiredFeeRate: asNumber,
              minerFee: asNumber,
              decimals: asNumber,
              selected: asBoolean
            })
          )
        })
      ),
      options: {
        headers: {
          Accept: 'application/payment-options'
        }
      }
    })

    // Fetch Access Token From OAuth Protocol:
    if (ACCESS_TOKEN == null) {
      const credentialsString = `${pluginKeys.clientId}:${pluginKeys.clientSecret}`
      const credentialsBytes = Uint8Array.from(credentialsString.split('').map(char => char.charCodeAt(0)))
      const base64Credentials = wasBase64(credentialsBytes)

      const accessTokenResponse = await fetchAccessToken({
        headers: {
          Authorization: `Basic ${base64Credentials}`
        }
      })

      ACCESS_TOKEN = accessTokenResponse.access_token
    }

    const authorizedFetchOptions: RequestInit = {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        client_id: pluginKeys.clientId
      }
    }
    const userAuthenticatedFetchOptions = {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        client_id: pluginKeys.clientId,
        UserName: '',
        requestedUUID: params.deviceId
      }
    }
    const fetchCreateUser = fetcherWithOptions(fetchCreateUserBase, authorizedFetchOptions)
    const fetchGetGiftCards = fetcherWithOptions(fetchGetGiftCardsBase, authorizedFetchOptions)
    const fetchPurchaseGiftCard = fetcherWithOptions(fetchPurchaseGiftCardBase, userAuthenticatedFetchOptions)

    //
    // State:
    //

    let hiddenCardIds: number[] = asStoreHiddenCards(await store.getItem(STORE_HIDDEN_CARDS_KEY).catch(_ => undefined))
    const ratesCache: { [currencyCode: string]: { expiry: number; rateQueryPromise: Promise<number> } } = {}

    //
    // Private methods:
    //

    /**
     * Get the purchase rate for a card in units of crypto amount per fiat unit
     * (e.g. 3700 sats per 1 USD).
     */
    async function getCardPurchaseRateAmount(currencyCode: string, cardAmount: number): Promise<number> {
      // Return cached value:
      if (ratesCache[currencyCode] != null) {
        const { expiry, rateQueryPromise } = ratesCache[currencyCode]
        if (expiry > Date.now()) return await rateQueryPromise
      }

      // Update cache value with new query:
      const ratePromise = queryCardPurchaseRateAmount(currencyCode, cardAmount)
      ratesCache[currencyCode] = {
        expiry: Date.now() + ONE_MINUTE,
        rateQueryPromise: ratePromise
      }
      return await ratePromise
    }

    function checkAmountMinMax(fiatAmount: number) {
      if (fiatAmount > MAX_FIAT_CARD_PURCHASE_AMOUNT) {
        throw new Error(sprintf(lstrings.card_amount_max_error_message_s, MAX_FIAT_CARD_PURCHASE_AMOUNT))
      }
      if (fiatAmount < MIN_FIAT_CARD_PURCHASE_AMOUNT) {
        throw new Error(sprintf(lstrings.card_amount_min_error_message_s, MIN_FIAT_CARD_PURCHASE_AMOUNT))
      }
    }

    async function createUser(): Promise<string> {
      const uuid = makeUuid()
      const uuidEmail = `${uuid}@edge.app`
      console.log(`Creating Ionia User: requestedUUID=${params.deviceId} Email=${uuidEmail}`)
      const createUserResponse = await fetchCreateUser({
        payload: {
          requestedUUID: params.deviceId,
          Email: uuidEmail
        }
      })

      const ErrorMessage = createUserResponse.ErrorMessage ?? createUserResponse.Data?.ErrorMessage
      if (!createUserResponse.Successful || createUserResponse.Data == null) {
        throw new Error(`Failed to create user: ${ErrorMessage}`)
      }

      console.log(`Ionia user created successfully.`)

      const userName = createUserResponse.Data.UserName

      await store.setItem(STORE_USERNAME_KEY, userName)
      await store.setItem(STORE_EMAIL_KEY, uuidEmail)

      console.log(`Ionia user info saved to store.`)
      return userName
    }
    async function queryCardPurchaseRateAmount(currencyCode: string, cardAmount: number): Promise<number> {
      const cardPurchase = await queryPurchaseCard(currencyCode, cardAmount)
      const paymentUrl = new URL(cardPurchase.uri, true)
      const paymentRequestUrl = paymentUrl.query.r

      if (paymentRequestUrl == null) throw new Error(`Missing or invalid payment URI from purchase gift card API`)

      const paymentProtocolResponse = await fetchPaymentOptions({
        endpoint: paymentRequestUrl
      })
      const paymentOption = paymentProtocolResponse.paymentOptions.find(
        paymentOption => paymentOption.chain === currencyCode && paymentOption.currency === currencyCode
      )

      if (paymentOption == null) throw new Error(`Missing payment option for currencyCode '${currencyCode}'`)

      return paymentOption.estimatedAmount
    }

    async function queryPurchaseCard(currencyCode: string, cardAmount: number): Promise<IoniaPurchaseCard> {
      checkAmountMinMax(cardAmount)
      const purchaseResponse = await fetchPurchaseGiftCard({
        payload: {
          MerchantId: pluginKeys.merchantId,
          Amount: cardAmount,
          Currency: currencyCode
        }
      })
      if (purchaseResponse.Data == null) throw new Error(purchaseResponse.ErrorMessage)
      return purchaseResponse.Data
    }

    //
    // Public:
    //

    const fiatProvider: FiatProvider<IoniaMethods> = {
      partnerIcon: '',
      providerId: makeIoniaProvider.providerId,
      pluginDisplayName: 'Ionia',

      async getSupportedAssets() {
        const fiatProviderAssetMap: FiatProviderAssetMap = {
          crypto: {
            bitcoin: { BTC: true },
            bitcoincash: { BCH: true },
            dash: { DASH: true },
            dogecoin: { DOGE: true },
            litecoin: { LTC: true }
          },
          fiat: {
            'iso:USD': true
          }
        }
        return fiatProviderAssetMap
      },
      async getQuote(params: FiatProviderGetQuoteParams) {
        if (params.wallet == null) throw new Error('missing wallet')

        const rateAmount = await getCardPurchaseRateAmount(params.displayCurrencyCode, RATE_QUOTE_CARD_AMOUNT)
        const rateExchangeAmount = await params.wallet.nativeToDenomination(toBigNumberString(rateAmount), params.displayCurrencyCode)
        console.log(`Ionia rates a $${RATE_QUOTE_CARD_AMOUNT} card at ${rateExchangeAmount} ${params.displayCurrencyCode}`)

        const price = RATE_QUOTE_CARD_AMOUNT / parseFloat(rateExchangeAmount)
        const cryptoAmount =
          params.amountType === 'crypto' ? params.exchangeAmount : div(params.exchangeAmount, toBigNumberString(price), HARD_CURRENCY_PRECISION)
        const fiatAmount = params.amountType === 'fiat' ? params.exchangeAmount : mul(params.exchangeAmount, toBigNumberString(price))

        checkAmountMinMax(parseFloat(fiatAmount))

        const fiatProviderQuote: FiatProviderQuote = {
          providerId: makeIoniaProvider.providerId,
          partnerIcon: fiatProvider.partnerIcon,
          pluginDisplayName: '',
          displayCurrencyCode: params.displayCurrencyCode,
          cryptoAmount,
          isEstimate: true,
          fiatCurrencyCode: params.fiatCurrencyCode,
          fiatAmount,
          direction: 'sell',
          regionCode: params.regionCode,
          paymentTypes: params.paymentTypes,

          approveQuote: async params => {},
          closeQuote: async () => {}
        }

        return fiatProviderQuote
      },

      otherMethods: {
        async authenticate(shouldCreate = false) {
          const localUserName = await store.getItem(STORE_USERNAME_KEY).catch(_ => undefined)

          if (localUserName == null && !shouldCreate) return false

          // Use local username for authentication header, or create new user
          userAuthenticatedFetchOptions.headers.UserName = localUserName ?? (await createUser())

          // Only log the first 4 and last 4 characters in the UserName UUID
          const safeUserName = userAuthenticatedFetchOptions.headers.UserName.split('')
            .map((char, index, chars) => (index > 4 && index < chars.length - 4 ? 'x' : char))
            .join('')
          console.log(`Ionia authenticated user: UserName=${safeUserName} requestedUUID=${userAuthenticatedFetchOptions.headers.requestedUUID}`)

          return true
        },
        hideCard: async cardId => {
          const set = new Set(hiddenCardIds)
          set.add(cardId)
          hiddenCardIds = Array.from(set)
          await store.setItem(STORE_HIDDEN_CARDS_KEY, wasStoreHiddenCards(hiddenCardIds))
        },
        async getRewardsCards() {
          const giftCardsResponse = await fetchGetGiftCards({
            headers: userAuthenticatedFetchOptions.headers
          })
          const { Data: cards } = giftCardsResponse

          const out: UserRewardsCards = { activeCards: [], archivedCards: [] }
          // Filter all deleted cards:
          for (const card of cards) {
            if (hiddenCardIds.includes(card.id)) out.archivedCards.push(card)
            else out.activeCards.push(card)
          }
          return out
        },
        queryPurchaseCard
      }
    }

    return fiatProvider
  }
}
