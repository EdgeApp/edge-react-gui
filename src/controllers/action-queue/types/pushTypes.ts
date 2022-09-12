//
// Events that devices or logins may subscribe to.
//

export type AddressBalanceTrigger = {
  readonly type: 'address-balance'
  readonly pluginId: string
  readonly tokenId?: string
  readonly address: string
  readonly aboveAmount?: string // Satoshis or Wei or such
  readonly belowAmount?: string // Satoshis or Wei or such
}

export type PriceChangeTrigger = {
  readonly type: 'price-change'
  readonly pluginId: string
  readonly currencyPair: string // From our rates server
  readonly directions?: [string, string, string, string]
  readonly dailyChange?: number // Percentage
  readonly hourlyChange?: number // Percentage
}

export type PriceLevelTrigger = {
  readonly type: 'price-level'
  readonly currencyPair: string // From our rates server
  readonly aboveRate?: number
  readonly belowRate?: number
}

export type TxConfirmTrigger = {
  readonly type: 'tx-confirm'
  readonly pluginId: string
  readonly confirmations: number
  readonly txid: string
}

export type PushTrigger = AddressBalanceTrigger | PriceChangeTrigger | PriceLevelTrigger | TxConfirmTrigger

/**
 * Broadcasts a transaction to a blockchain.
 */
export type BroadcastTx = {
  readonly pluginId: string
  readonly rawTx: Uint8Array // asBase64
}

/**
 * Sends a push notification.
 */
export type PushMessage = {
  readonly title?: string
  readonly body?: string
  readonly data?: { [key: string]: string } // JSON to push to device
}

export type PushEventState =
  | 'waiting' // Waiting for the trigger
  | 'cancelled' // Removed before the trigger happened
  | 'triggered' // The trigger and effects are done
  | 'hidden' // Removed after being triggered

/**
 * Combines a trigger with an action.
 * This the in-memory format, independent of the database.
 */
export type PushEventStatus = {
  readonly eventId: string // From the client, not globally unique

  readonly broadcastTxs?: BroadcastTx[]
  readonly pushMessage?: PushMessage
  readonly trigger: PushTrigger

  // Mutable state:
  broadcastTxErrors?: Array<string | null> // For ones that fail
  pushMessageEmits?: number // Number of devices we sent to
  pushMessageFails?: number // Number of devices that failed
  state: PushEventState
  triggered?: Date // When did we see the trigger?
}

/**
 * Template for creating new push events.
 */
export type NewPushEvent = {
  readonly eventId: string
  readonly broadcastTxs?: BroadcastTx[]
  readonly pushMessage?: PushMessage
  readonly trigger: PushTrigger
}
