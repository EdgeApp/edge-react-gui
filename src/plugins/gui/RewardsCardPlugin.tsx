import { EdgeSpendInfo } from 'edge-core-js'
import React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../../components/modals/ButtonsModal'
import { Airship, showToast } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { EdgeTokenId } from '../../types/types'
import { openBrowserUri } from '../../util/WebUtils'
import { FiatPlugin, FiatPluginFactory, FiatPluginStartParams, FiatPluginWalletPickerResult } from './fiatPluginTypes'

const SUPPORT_URL = 'https://edge.app/cards/'

export interface RewardsCardItem {
  id: string
  expiration: Date
  url: string
}

const PLACEHOLDER_ITEMS: RewardsCardItem[] = Array.from({ length: 10 }).map(() => ({ id: Math.random().toString(), expiration: new Date(), url: '' }))

export const makeRewardsCardPlugin: FiatPluginFactory = async params => {
  const { showUi, account, guiPlugin } = params
  const { pluginId } = guiPlugin

  const showDashboard = () => {
    showUi.rewardsCardDashboard({
      items: PLACEHOLDER_ITEMS,
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

  const showDeleteItemModal = async (item: RewardsCardItem) => {
    const answer = await Airship.show<'delete' | 'keep' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        buttons={{
          keep: { label: lstrings.string_keep, type: 'primary' },
          delete: { label: lstrings.string_delete, type: 'escape' }
        }}
        title={lstrings.rewards_card_delete_modal_title}
        message={sprintf(lstrings.rewards_card_delete_modal_message_s, item.expiration)}
      />
    ))
    if (answer === 'delete') showToast('Deleted it!')
  }

  const showNewCardConfirm = async (walletId: string, spendInfo: EdgeSpendInfo) => {
    showUi.send({ walletId, spendInfo })
  }

  const showNewCardEnterAmount = async (walletListResult: FiatPluginWalletPickerResult) => {
    const { walletId, currencyCode } = walletListResult
    if (walletId == null || currencyCode == null) return

    const wallet = account.currencyWallets[walletId]
    if (wallet == null) return await showUi.showError(new Error(`Missing wallet with ID ${walletId}`))

    const fiatCurrencyCode = wallet.fiatCurrencyCode
    const displayFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')
    showUi.enterAmount({
      headerTitle: lstrings.rewards_card_add_new_input_amount_title,
      label1: sprintf(lstrings.fiat_plugin_amount_currencycode, displayFiatCurrencyCode),
      label2: sprintf(lstrings.fiat_plugin_amount_currencycode, currencyCode),
      async onChangeText() {},
      async onFieldChange() {
        return undefined
      },
      async onPoweredByClick() {},
      async onSubmit(event) {
        const spendInfo: EdgeSpendInfo = {
          currencyCode,
          spendTargets: [
            {
              nativeAmount: event.value.response.value2
            }
          ]
        }

        showNewCardConfirm(walletId, spendInfo)
      }
    })
  }

  const showNewCardWalletListModal = async () => {
    const allowedAssets: EdgeTokenId[] = [
      {
        pluginId: 'bitcoin'
      }
    ]
    const walletListResult: FiatPluginWalletPickerResult = await showUi.walletPicker({
      headerTitle: lstrings.select_wallet,
      allowedAssets,
      showCreateWallet: false
    })
    showNewCardEnterAmount(walletListResult)
  }

  const showWelcome = () => {
    showUi.rewardsCardWelcome({
      onMoreInfo() {
        openBrowserUri(SUPPORT_URL)
      },
      onNewCard() {
        showNewCardWalletListModal().catch(showUi.showError)
      }
    })
  }

  const fiatPlugin: FiatPlugin = {
    pluginId,
    startPlugin: async (params: FiatPluginStartParams) => {
      if (PLACEHOLDER_ITEMS.length > 0) {
        showDashboard()
      } else {
        showWelcome()
      }
    }
  }
  return fiatPlugin
}
