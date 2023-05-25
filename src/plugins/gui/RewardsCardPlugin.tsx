import { eq, toFixed } from 'biggystring'
import { EdgeMetadata, EdgeParsedUri } from 'edge-core-js'
import React from 'react'
import { sprintf } from 'sprintf-js'

import { addressWarnings } from '../../actions/ScanActions'
import { Space } from '../../components/layout/Space'
import { showError } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { EdgeTokenId } from '../../types/types'
import { runWithTimeout, snooze } from '../../util/utils'
import { openBrowserUri } from '../../util/WebUtils'
import { FiatPlugin, FiatPluginFactory, FiatPluginStartParams, FiatPluginWalletPickerResult } from './fiatPluginTypes'
import { FiatProviderGetQuoteParams } from './fiatProviderTypes'
import { getRateFromQuote } from './pluginUtils'
import { IoniaMethods, makeIoniaProvider } from './providers/ioniaProvider'
import { RewardCard } from './scenes/RewardsCardDashboardScene'
import { initializeProviders } from './util/initializeProviders'

const SUPPORT_URL = 'https://edge.app/cards/'

export interface RewardsCardItem {
  id: number
  expiration: Date
  url: string
}

const PROVIDER_FACTORIES = [makeIoniaProvider]

export const makeRewardsCardPlugin: FiatPluginFactory = async params => {
  const { showUi, account, guiPlugin } = params
  const { pluginId } = guiPlugin

  const providers = await initializeProviders<IoniaMethods>(PROVIDER_FACTORIES, params)
  if (providers.length === 0) throw new Error('No enabled providers for RewardsCardPlugin')
  const provider = providers[0]

  // Get supported crypto assets:
  const supportedAssetMap = await provider.getSupportedAssets([])
  const allowedAssets: EdgeTokenId[] = Object.keys(supportedAssetMap.crypto).map(pluginId => ({ pluginId }))

  //
  // Helpers:
  //

  async function getRewardCards(): Promise<RewardsCardItem[]> {
    const giftCards = await provider.otherMethods.getGiftCards()
    const rewardCards: RewardsCardItem[] = giftCards.cards.map(card => {
      // Expires 6 calendar months from the creation date
      const expirationDate = new Date(card.CreatedDate.valueOf())
      expirationDate.setMonth(card.CreatedDate.getMonth() + 6)

      return {
        id: card.Id,
        expiration: expirationDate,
        url: card.CardNumber
      }
    })
    // Reverse order to show latest first
    return rewardCards
  }

  async function refreshRewardsCards(retries: number) {
    if (retries > 15) return
    await getRewardCards()
      .then(async cards => {
        if (cards.length === rewardCards.length) {
          console.log(`Retrying rewards card refresh`)
          await snooze(retries * 1000)
          return await refreshRewardsCards(retries + 1)
        }
        rewardCards = cards
        showDashboard({ showLoading: false })
      })
      .catch(async error => {
        console.error(`Error refreshing rewards cards: ${String(error)}`)
        return await refreshRewardsCards(retries + 1)
      })
  }

  //
  // Shared State:
  //

  let redundantQuoteParams: Pick<FiatPluginStartParams, 'direction' | 'paymentTypes' | 'regionCode'>
  // Get the reward cards:
  let rewardCards: RewardsCardItem[] = []

  //
  // State Machine:
  //

  const showDashboard = async ({ showLoading }: { showLoading: boolean }) => {
    showUi.rewardsCardDashboard({
      items: rewardCards,
      showLoading,
      onCardPress({ url }) {
        showUi.openWebView({ url })
      },
      onHelpPress() {
        openBrowserUri(SUPPORT_URL)
      },
      onNewPress() {
        showNewCardWalletListModal().catch(showUi.showError)
      },
      onRemovePress(item: RewardsCardItem) {
        showDeleteItemModal(item).catch(showUi.showError)
      }
    })
  }

  const showDeleteItemModal = async (card: RewardsCardItem) => {
    const answer = await showUi.buttonModal({
      buttons: {
        delete: { label: lstrings.string_delete, type: 'secondary' },
        keep: { label: lstrings.string_keep, type: 'escape' }
      },
      title: lstrings.rewards_card_delete_modal_title,
      message: lstrings.rewards_card_delete_modal_message,
      children: (
        <Space around={1}>
          <RewardCard item={card} />
        </Space>
      )
    })

    if (answer === 'delete') {
      // Hide the card
      provider.otherMethods.hideCard(card.id)
      // Remove card from plugin state
      rewardCards = rewardCards.filter(c => c.id !== card.id)
      // Reset state for dashboard
      showDashboard({ showLoading: false })
    }
  }

  const showNewCardEnterAmount = async (walletListResult: FiatPluginWalletPickerResult) => {
    const { walletId, currencyCode } = walletListResult
    if (walletId == null || currencyCode == null) return

    const wallet = account.currencyWallets[walletId]
    if (wallet == null) return await showUi.showError(new Error(`Missing wallet with ID ${walletId}`))

    let counter = 0
    const fiatCurrencyCode = wallet.fiatCurrencyCode
    const displayFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')
    showUi.enterAmount({
      headerTitle: lstrings.rewards_card_add_new_input_amount_title,
      label1: sprintf(lstrings.fiat_plugin_amount_currencycode, displayFiatCurrencyCode),
      label2: sprintf(lstrings.fiat_plugin_amount_currencycode, currencyCode),
      initState: {
        value1: '500'
      },
      async onChangeText() {},
      async onFieldChange(event) {
        const myCounter = ++counter

        const { stateManager } = event

        const otherFieldKey = event.value.sourceFieldNum === 1 ? 'value2' : 'value1'
        const spinnerKey = event.value.sourceFieldNum === 1 ? 'spinner2' : 'spinner1'

        stateManager.update({ [spinnerKey]: true })

        if (eq(event.value.value, '0')) {
          stateManager.update({ [otherFieldKey]: '', [spinnerKey]: false })
          return
        }
        let quoteParams: FiatProviderGetQuoteParams

        if (event.value.sourceFieldNum === 1) {
          // User entered a fiat value. Convert to crypto
          quoteParams = {
            wallet,
            pluginId: wallet.currencyInfo.pluginId,
            displayCurrencyCode: currencyCode,
            exchangeAmount: event.value.value,
            fiatCurrencyCode,
            amountType: 'fiat',
            ...redundantQuoteParams
          }
        } else {
          // User entered a crypto value. Convert to fiat
          quoteParams = {
            wallet,
            pluginId: wallet.currencyInfo.pluginId,
            displayCurrencyCode: currencyCode,
            exchangeAmount: event.value.value,
            fiatCurrencyCode,
            amountType: 'crypto',
            ...redundantQuoteParams
          }
        }

        const bestQuote = await provider.getQuote(quoteParams).catch(error => {
          stateManager.update({ statusText: { content: String(error), textType: 'error' }, [spinnerKey]: false })
          throw error
        })

        // Abort to avoid race conditions
        if (myCounter !== counter) return

        const exchangeRateText = getRateFromQuote(bestQuote, displayFiatCurrencyCode)
        stateManager.update({
          statusText: { content: exchangeRateText },
          // poweredBy: { poweredByText: bestQuote.pluginDisplayName, poweredByIcon: bestQuote.partnerIcon },
          [otherFieldKey]: event.value.sourceFieldNum === 1 ? toFixed(bestQuote.cryptoAmount, 6) : toFixed(bestQuote.fiatAmount, 2),
          [spinnerKey]: false
        })
      },
      async onPoweredByClick() {},
      async onSubmit(event) {
        const fiatAmount = parseFloat(toFixed(event.value.response.value1, 0, 2))
        const exchangeAmount = event.value.response.value2
        const nativeAmount = await wallet.denominationToNative(exchangeAmount, currencyCode)
        const purchaseCard = await provider.otherMethods.queryPurchaseCard(currencyCode, fiatAmount)

        console.log(`Show send of ${exchangeAmount} ${currencyCode} (${nativeAmount} native) to '${purchaseCard.uri}' to purchase ${fiatAmount} USD card.`)

        const parsedUri: EdgeParsedUri & { paymentProtocolUrl?: string } = await wallet.parseUri(purchaseCard.uri, currencyCode)

        // Check if the URI requires a warning to the user
        const approved = await addressWarnings(parsedUri, currencyCode)
        if (!approved) return

        if (!parsedUri.paymentProtocolUrl) {
          return showError(lstrings.rewards_card_error_missing_payment_address)
        }

        const onDone = () => {
          showDashboard({ showLoading: true })
          refreshRewardsCards(0)
            .then(async () => await showDashboard({ showLoading: false }))
            .catch(showError)
        }

        const metadata: EdgeMetadata = {
          name: 'Visa® Prepaid Card',
          category: 'expense:Visa® Prepaid Card'
        }
        showUi.showToastSpinner(
          lstrings.rewards_card_getting_invoice,
          showUi.sendPaymentProto({ uri: parsedUri.paymentProtocolUrl, params: { wallet, currencyCode, metadata, onDone } })
        )
      }
    })
  }

  const showNewCardWalletListModal = async () => {
    const walletListResult: FiatPluginWalletPickerResult = await showUi.walletPicker({
      headerTitle: lstrings.rewards_card_select_wallet,
      allowedAssets,
      showCreateWallet: false
    })
    showNewCardEnterAmount(walletListResult)
  }

  const showWelcome = async () => {
    showUi.rewardsCardWelcome({
      onMoreInfo() {
        openBrowserUri(SUPPORT_URL)
      },
      onNewCard() {
        provider.otherMethods
          .authenticate()
          .then(isAuthenticated => {
            if (isAuthenticated) return 'yes'
            // First time user are shown TOS and authenticate with account creation)
            return showUi.buttonModal({
              title: lstrings.rewards_card_dashboard_title,
              message: lstrings.rewards_card_terms_of_use_message,
              buttons: {
                yes: {
                  label: lstrings.string_i_agree,
                  type: 'primary'
                },
                no: {
                  label: lstrings.string_decline,
                  type: 'escape'
                }
              }
            })
          })
          .then(async answer => {
            if (answer !== 'yes') return

            await provider.otherMethods.authenticate(true)
            await showNewCardWalletListModal()
          })
          .catch(showUi.showError)
      }
    })
  }

  //
  // Fiat Plugin:
  //

  const fiatPlugin: FiatPlugin = {
    pluginId,
    startPlugin: async (startParams: FiatPluginStartParams) => {
      // Auth User:
      const isAuthenticated = await provider.otherMethods.authenticate().catch(e => {
        throw new Error(lstrings.rewards_card_error_authenticate)
      })

      if (isAuthenticated) {
        // Get/refresh rewards cards:
        rewardCards = await showUi.showToastSpinner(
          lstrings.loading,
          runWithTimeout(
            getRewardCards().catch(e => {
              throw new Error(lstrings.rewards_card_error_retrieving_cards)
            }),
            11000,
            new Error(lstrings.rewards_card_error_timeout_loading)
          )
        )
      }

      redundantQuoteParams = {
        direction: startParams.direction,
        paymentTypes: startParams.paymentTypes,
        regionCode: startParams.regionCode
      }

      if (rewardCards.length > 0) {
        await showDashboard({ showLoading: false })
      } else {
        await showWelcome()
      }
    }
  }
  return fiatPlugin
}
