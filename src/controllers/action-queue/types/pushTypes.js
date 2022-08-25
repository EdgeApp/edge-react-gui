// @flow

//
// Events that devices or logins may subscribe to.
//

export type AddressBalanceTrigger = {
  +type: 'address-balance',
  +pluginId: string,
  +tokenId?: string,
  +address: string,
  +aboveAmount?: string, // Satoshis or Wei or such
  +belowAmount?: string // Satoshis or Wei or such
}

export type PriceChangeTrigger = {
  +type: 'price-change',
  +pluginId: string,
  +tokenId?: string,
  +dailyChange?: number, // Percentage
  +hourlyChange?: number // Percentage
}

export type PriceLevelTrigger = {
  +type: 'price-level',
  +currencyPair: string, // From our rates server
  +aboveRate?: number,
  +belowRate?: number
}

export type TxConfirmTrigger = {
  +type: 'tx-confirm',
  +pluginId: string,
  +confirmations: number,
  +txid: string
}

export type PushTrigger = AddressBalanceTrigger | PriceChangeTrigger | PriceLevelTrigger | TxConfirmTrigger

/**
 * Broadcasts a transaction to a blockchain.
 */
export type BroadcastTx = {
  +pluginId: string,
  +rawTx: Uint8Array // asBase64
}

/**
 * Sends a push notification.
 */
export type PushMessage = {
  +title?: string,
  +body?: string,
  +data?: { [key: string]: string } // JSON to push to device
}

export type PushEventState = 'waiting' | 'cancelled' | 'triggered'
/**
 * Combines a trigger with an action.
 * This the in-memory format, independent of the database.
 */
export type PushEvent = {
  +created: Date,
  +eventId: string, // From the client, not globally unique
  +deviceId?: string,
  +loginId?: Uint8Array,

  +broadcastTxs?: BroadcastTx[],
  +pushMessage?: PushMessage,
  +trigger: PushTrigger,

  // Mutable state:
  broadcastTxErrors?: Array<string | null>, // For ones that fail
  pushMessageEmits?: number, // Number of devices we sent to
  pushMessageFails?: number, // Number of devices that failed
  state: PushEventState,
  triggered?: Date // When did we see the trigger?
}

/**
 * Template for creating new push events.
 */
export type NewPushEvent = {
  +eventId: string,
  +broadcastTxs?: BroadcastTx[],
  +pushMessage?: PushMessage,
  +recurring: boolean,
  +trigger: PushTrigger
}
