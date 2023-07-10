import { eq, toFixed } from 'biggystring'
import React from 'react'
import { sprintf } from 'sprintf-js'

import { Space } from '../../components/layout/Space'
import { showError } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { EdgeTokenId } from '../../types/types'
import { logActivity } from '../../util/logger'
import { runWithTimeout, snooze } from '../../util/utils'
import { openBrowserUri } from '../../util/WebUtils'
import { FiatPlugin, FiatPluginFactory, FiatPluginStartParams, FiatPluginWalletPickerResult } from './fiatPluginTypes'
import { FiatProviderGetQuoteParams, FiatProviderQuote } from './fiatProviderTypes'
import { getRateFromQuote } from './pluginUtils'
import { IoniaMethods, makeIoniaProvider } from './providers/ioniaProvider'
import { RewardsCard } from './scenes/RewardsCardDashboardScene'
import { initializeProviders } from './util/initializeProviders'

const SUPPORT_URL = 'https://edge.app/visa-card-how-to'

const HARD_CODED_FIAT_CURRENCY_CODE = 'iso:USD'

export interface RewardsCardItem {
  id: number
  creationDate: Date
  expirationDate: Date
  amount?: number
  purchaseAsset?: string
  url: string
}

export interface UserRewardsCards {
  activeCards: RewardsCardItem[]
  archivedCards: RewardsCardItem[]
}

const PROVIDER_FACTORIES = [makeIoniaProvider]

export const makeRewardsCardPlugin: FiatPluginFactory = async params => {
  const { showUi, account, guiPlugin } = params
  const { pluginId } = guiPlugin

  const providers = await initializeProviders<IoniaMethods>(PROVIDER_FACTORIES, params)
  if (providers.length === 0) throw new Error('No enabled providers for RewardsCardPlugin')
  const provider = providers[0]

  // Get supported crypto assets:
  const supportedAssetMap = await provider.getSupportedAssets({ paymentTypes: [], regionCode: { countryCode: 'US' } })
  const allowedAssets: EdgeTokenId[] = Object.keys(supportedAssetMap.crypto).map(pluginId => ({ pluginId }))

  //
  // Helpers:
  //

  async function refreshRewardsCards(retries: number) {
    if (retries > 15) return
    await await provider.otherMethods
      .getRewardsCards()
      .then(async ({ activeCards, archivedCards }) => {
        if (activeCards.length === userRewardsCards.activeCards.length) {
          logActivity(`Retrying rewards card refresh`)
          await snooze(retries * 1000)
          return await refreshRewardsCards(retries + 1)
        }
        userRewardsCards = { activeCards, archivedCards }
        await showDashboard({ showLoading: false })
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
  let userRewardsCards: UserRewardsCards = { activeCards: [], archivedCards: [] }
  //
  // State Machine:
  //

  const showDashboard = async ({ showLoading }: { showLoading: boolean }) => {
    await showUi.rewardsCardDashboard({
      items: userRewardsCards.activeCards,
      showLoading,
      onCardLongPress({ url }) {
        showUi
          .setClipboard(url)
          .then(async () => {
            await showUi.showToast(lstrings.fragment_copied)
          })
          .catch(e => showError(e))
      },
      onCardPress({ url }) {
        showUi.openWebView({ url }).catch(err => showError(err))
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
      title: lstrings.delete_card_confirmation_title,
      message: lstrings.rewards_card_delete_modal_message,
      children: (
        <Space around={0.5}>
          <RewardsCard item={card} />
        </Space>
      )
    })

    if (answer === 'delete') {
      // Hide the card
      await provider.otherMethods.hideCard(card.id)
      // Remove card from plugin state
      userRewardsCards.activeCards = userRewardsCards.activeCards.filter(c => c.id !== card.id)

      // Reset state for dashboard
      await showDashboard({ showLoading: false })
    }
  }

  const showNewCardEnterAmount = async (walletListResult: FiatPluginWalletPickerResult) => {
    const { walletId, currencyCode } = walletListResult
    if (walletId == null || currencyCode == null) return

    const wallet = account.currencyWallets[walletId]
    if (wallet == null) return await showUi.showError(new Error(`Missing wallet with ID ${walletId}`))

    let providerQuote: FiatProviderQuote | undefined
    let counter = 0
    const fiatCurrencyCode = HARD_CODED_FIAT_CURRENCY_CODE // wallet.fiatCurrencyCode
    const displayFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')
    showUi.enterAmount({
      headerTitle: lstrings.rewards_card_add_new_input_amount_title,
      label1: sprintf(lstrings.fiat_plugin_amount_currencycode, displayFiatCurrencyCode),
      label2: sprintf(lstrings.fiat_plugin_amount_currencycode, currencyCode),
      initState: {
        value1: '500'
      },
      async onChangeText() {},
      async convertValue(sourceFieldNum, value, stateManager) {
        const myCounter = ++counter

        if (eq(value, '0')) {
          return ''
        }
        let quoteParams: FiatProviderGetQuoteParams

        if (sourceFieldNum === 1) {
          // User entered a fiat value. Convert to crypto
          quoteParams = {
            wallet,
            pluginId: wallet.currencyInfo.pluginId,
            displayCurrencyCode: currencyCode,
            exchangeAmount: value,
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
            exchangeAmount: value,
            fiatCurrencyCode,
            amountType: 'crypto',
            ...redundantQuoteParams
          }
        }

        try {
          providerQuote = await provider.getQuote(quoteParams)
        } catch (error) {
          stateManager.update({ statusText: { content: String(error), textType: 'error' } })
          console.error(error)
          return ''
        }

        if (providerQuote == null) return

        // Abort to avoid race conditions
        if (myCounter !== counter) return

        const exchangeRateText = getRateFromQuote(providerQuote, displayFiatCurrencyCode)
        stateManager.update({
          statusText: { content: exchangeRateText }
        })

        return sourceFieldNum === 1 ? toFixed(providerQuote.cryptoAmount, 6) : toFixed(providerQuote.fiatAmount, 2)
      },
      async onPoweredByClick() {},
      async onSubmit(event) {
        if (providerQuote == null) return

        await providerQuote
          .approveQuote({ showUi, coreWallet: wallet })
          .then(async () => {
            await showDashboard({ showLoading: true })
            await refreshRewardsCards(0).catch(showError)
            await showDashboard({ showLoading: false })
          })
          .catch(error => {
            if (String(error).includes('Error: User cancelled quote')) {
              logActivity(String(error))
              return
            }
            throw error
          })
      }
    })
  }

  const showNewCardWalletListModal = async () => {
    const walletListResult: FiatPluginWalletPickerResult = await showUi.walletPicker({
      headerTitle: lstrings.select_wallet_to_purchase_card_title,
      allowedAssets,
      showCreateWallet: false
    })
    await showNewCardEnterAmount(walletListResult)
  }

  const showWelcome = async () => {
    await showUi.rewardsCardWelcome({
      onMoreInfo() {
        openBrowserUri(SUPPORT_URL)
      },
      onNewCard() {
        provider.otherMethods
          .authenticate()
          .then(async isAuthenticated => {
            if (isAuthenticated) return 'yes'
            // First time user are shown TOS and authenticate with account creation)
            const answer = await showUi.buttonModal({
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
      const isAuthenticated = await provider.otherMethods.authenticate().catch(error => {
        console.error(error)
        throw new Error(lstrings.rewards_card_error_authenticate)
      })

      if (isAuthenticated) {
        // Get/refresh rewards cards:
        userRewardsCards = await showUi.showToastSpinner(
          lstrings.loading,
          runWithTimeout(
            provider.otherMethods.getRewardsCards().catch(error => {
              console.error(error)
              throw new Error(lstrings.rewards_card_error_retrieving_cards)
            }),
            11000,
            new Error(lstrings.rewards_card_error_timeout_loading)
          )
        )
      }

      const hasCards = userRewardsCards.activeCards.length + userRewardsCards.activeCards.length > 0

      redundantQuoteParams = {
        direction: startParams.direction,
        paymentTypes: startParams.paymentTypes,
        regionCode: startParams.regionCode
      }

      if (isAuthenticated && hasCards) {
        await showDashboard({ showLoading: false })
      } else {
        await showWelcome()
      }
    }
  }
  return fiatPlugin
}
