import { asArray, asDate, asEither, asNumber, asObject, asOptional, asString, asTuple, asValue, Cleaner } from 'cleaners'

import { asBase64 } from '../../../util/cleaners/asBase64'
import { NewPushEvent } from './pushApiTypes'
import {
  AddressBalanceTrigger,
  AllTrigger,
  AnyTrigger,
  BroadcastTx,
  PriceChangeTrigger,
  PriceLevelTrigger,
  PushEventState,
  PushMessage,
  PushTrigger,
  PushTriggerState,
  TxConfirmTrigger
} from './pushTypes'

export const asAddressBalanceTrigger: Cleaner<AddressBalanceTrigger> = asObject({
  type: asValue('address-balance'),
  pluginId: asString,
  tokenId: asOptional(asString),
  address: asString,
  aboveAmount: asOptional(asString), // Satoshis or Wei or such
  belowAmount: asOptional(asString) // Satoshis or Wei or such
})

export const asAllTrigger = asObject<AllTrigger>({
  type: asValue('all'),
  triggers: asArray(raw => asPushTrigger(raw))
})

export const asAnyTrigger = asObject<AnyTrigger>({
  type: asValue('any'),
  triggers: asArray(raw => asPushTrigger(raw))
})

export const asPriceChangeTrigger: Cleaner<PriceChangeTrigger> = asObject({
  type: asValue('price-change'),
  pluginId: asString,
  currencyPair: asString, // From our rates server
  directions: asOptional(asTuple(asString, asString, asString, asString)),
  dailyChange: asOptional(asNumber), // Percentage
  hourlyChange: asOptional(asNumber) // Percentage
})

export const asPriceLevelTrigger: Cleaner<PriceLevelTrigger> = asObject({
  type: asValue('price-level'),
  currencyPair: asString, // From our rates server
  aboveRate: asOptional(asNumber),
  belowRate: asOptional(asNumber)
})

export const asTxConfirmTrigger: Cleaner<TxConfirmTrigger> = asObject({
  type: asValue('tx-confirm'),
  pluginId: asString,
  confirmations: asNumber,
  txid: asString
})

export const asPushTrigger: Cleaner<PushTrigger> = asEither(
  asAddressBalanceTrigger,
  asAllTrigger,
  asAnyTrigger,
  asPriceChangeTrigger,
  asPriceLevelTrigger,
  asTxConfirmTrigger
)

export const asPushTriggerState: Cleaner<PushTriggerState> = asOptional(
  asEither(
    asArray(raw => asPushTriggerState(raw)),
    asDate
  )
)

export const asBroadcastTx: Cleaner<BroadcastTx> = asObject({
  pluginId: asString,
  rawTx: asBase64
})

export const asPushMessage: Cleaner<PushMessage> = asObject({
  title: asOptional(asString),
  body: asOptional(asString),
  data: asOptional(asObject(asString))
})

export const asPushEventState: Cleaner<PushEventState> = asValue('waiting', 'cancelled', 'triggered', 'hidden')

export const asNewPushEvent: Cleaner<NewPushEvent> = asObject({
  eventId: asString,
  broadcastTxs: asOptional(asArray(asBroadcastTx)),
  pushMessage: asOptional(asPushMessage),
  trigger: asPushTrigger
})
