import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { PriceChangePayload } from '../../controllers/action-queue/types/pushPayloadTypes'
import { lstrings } from '../../locales/strings'
import { ThunkAction } from '../../types/reduxTypes'
import { NavigationBase } from '../../types/routerTypes'
import { Airship } from '../services/AirshipInstance'
import { ButtonsModal } from './ButtonsModal'

export function launchPriceChangeBuySellSwapModal(navigation: NavigationBase, data: PriceChangePayload): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { pluginId, body } = data
    const currencyCode = state.core.account.currencyConfig[pluginId].currencyInfo.currencyCode

    const threeButtonModal = await Airship.show<'buy' | 'sell' | 'exchange' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.price_change_notification}
        message={`${body} ${sprintf(lstrings.price_change_buy_sell_trade, currencyCode)}`}
        buttons={{
          buy: { label: lstrings.title_buy, type: 'secondary' },
          sell: { label: lstrings.title_sell },
          exchange: { label: lstrings.buy_crypto_modal_exchange }
        }}
      />
    ))

    if (threeButtonModal === 'buy') {
      navigation.navigate('buyTab', { screen: 'pluginListBuy' })
    } else if (threeButtonModal === 'sell') {
      navigation.navigate('sellTab', { screen: 'pluginListSell' })
    } else if (threeButtonModal === 'exchange') {
      navigation.navigate('exchangeTab', { screen: 'exchange' })
    }
  }
}
