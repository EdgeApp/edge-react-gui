import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { PriceChangePayload } from '../../controllers/action-queue/types/pushPayloadTypes'
import s from '../../locales/strings'
import { Dispatch, GetState } from '../../types/reduxTypes'
import { Actions } from '../../types/routerTypes'
import { Airship } from '../services/AirshipInstance'
import { ButtonsModal } from './ButtonsModal'

export const launchPriceChangeBuySellSwapModal = (data: PriceChangePayload) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { pluginId, body } = data
  const currencyCode = state.core.account.currencyConfig[pluginId].currencyInfo.currencyCode

  const threeButtonModal = await Airship.show<'buy' | 'sell' | 'exchange' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.price_change_notification}
      message={`${body} ${sprintf(s.strings.price_change_buy_sell_trade, currencyCode)}`}
      buttons={{
        buy: { label: s.strings.title_buy, type: 'secondary' },
        sell: { label: s.strings.title_sell },
        exchange: { label: s.strings.buy_crypto_modal_exchange }
      }}
    />
  ))

  if (threeButtonModal === 'buy') {
    Actions.jump('pluginListBuy', { direction: 'buy' })
  } else if (threeButtonModal === 'sell') {
    Actions.jump('pluginListSell', { direction: 'sell' })
  } else if (threeButtonModal === 'exchange') {
    Actions.jump('exchangeScene', {})
  }
}
