import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'

/**
 * Why an entered address was not adopted as the send destination. Every path
 * that leaves the address tile empty maps to one of these, so the user always
 * gets a message naming the reason.
 *
 * `networkName` is a display name such as "Bitcoin".
 */
export type AddressRejection =
  /** Not an address on `networkName`, the network it was read against. */
  | { type: 'invalid'; networkName: string }
  /**
   * An address on some other network, entered into a send that can only pay
   * `networkName` because it cannot turn into a swap.
   */
  | { type: 'otherNetwork'; networkName: string }
  /**
   * Not an address on `networkName`, and no network a swap could pay out to
   * recognizes it either.
   */
  | { type: 'unrecognized'; networkName: string }
  /**
   * An address on `networkName`, the sending wallet's own network, entered
   * while the recipient is set to receive on `payoutNetworkName`.
   */
  | { type: 'ownNetwork'; networkName: string; payoutNetworkName: string }

/**
 * The message shown for a rejected address. It never includes the address
 * itself, which may be a destination the user wants kept private.
 */
export const describeAddressRejection = (
  rejection: AddressRejection
): string => {
  const { networkName } = rejection
  switch (rejection.type) {
    case 'invalid':
      return sprintf(lstrings.send_address_invalid_1s, networkName)
    case 'otherNetwork':
      return sprintf(lstrings.send_address_other_network_1s, networkName)
    case 'unrecognized':
      return sprintf(
        lstrings.send_address_unrecognized_2s,
        networkName,
        config.appName
      )
    case 'ownNetwork':
      return sprintf(
        lstrings.send_address_own_network_2s,
        networkName,
        rejection.payoutNetworkName
      )
  }
}
