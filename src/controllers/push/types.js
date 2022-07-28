// @flow

// -----------------------------------------------------------------------------
// Push Server Types
// -----------------------------------------------------------------------------

export type Device = {
  appId: string,
  deviceId: string,
  deviceToken: string,
  rootLoginIds: Uint8Array[],
  created: Date,
  visited: Date
}

//
// Push Triggers
//

export type PriceChangeTrigger = {
  type: 'price-change',
  pluginId: string,
  tokenId: string,
  aboveRatio?: number,
  belowRatio?: number,
  range: 'hourly' | 'daily'
}

export type PriceLevelTrigger = {
  type: 'price-level',
  currencyPair: string,
  aboveRate?: number,
  belowRate?: number
}

export type AddressBalanceTrigger = {
  type: 'address-balance',
  pluginId: string,
  tokenId?: string,
  address: string,
  aboveAmount?: string,
  belowAmount?: string
}

export type TxConfirmTrigger = {
  type: 'tx-confirm',
  pluginId: string,
  confirmations: number,
  txid: string
}

export type PushTrigger = AddressBalanceTrigger | PriceChangeTrigger | PriceLevelTrigger | TxConfirmTrigger

//
// Push Event
//

export type PushEvent = {
  trigger: PushTrigger,
  triggered: boolean,

  pushMessage?: string,
  pushPayload?: mixed,
  broadcastTxs?: Array<{
    pluginId: string,
    rawTx: Uint8Array
  }>
}

//
// HTTP
//

export type PushRequestBody = {
  // The request payload:
  data: mixed,

  // Who is making the request:
  apiKey: string,
  appId: string,
  deviceId: string,

  // For logins:
  rootLoginId?: Uint8Array
  // rootSecretHash?: Uint8Array
}

/**
 * Refreshes the `visited` date on a device and its effects or logins.
 * Devices expire after 3 months.
 * POST /v2/device/checkin
 */

/**
 * Registers / updates a device.
 * POST /v2/device/update
 */
export interface UpdateDevicePayload {
  rootLoginIds: Uint8Array[]; // asArray(asBase64)
  events: PushEvent[];
  deviceToken: string;
}

/**
 * Gets a device from the database.
 * POST /v2/device
 */
export type DevicePayload = {
  deviceId: string,
  deviceToken: string,
  events: PushEvent[],
  rootLoginIds: Uint8Array[], // asArray(asBase64)
  created: Date,
  visited: Date
}

/**
 * Registers / updates a login.
 * POST /v2/login/update
 */
export type UpdateLoginPayload = {
  events: PushEvent[]

  // removeEvents?: string[]
  // replaceEvents?: PushEvent[]
  // newEvents?: PushEvent[]
}

/**
 * Reads a login from the database.
 * POST /v2/login
 */
export type LoginPayload = {
  deviceIds: string,
  events: PushEvent[],
  created: Date,
  visited: Date
}
