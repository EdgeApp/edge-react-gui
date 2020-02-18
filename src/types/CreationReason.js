// @flow

import { asDate } from 'cleaners'

import { type DiskInstallReason, type InstallReason, packInstallReason, unpackInstallReason } from './InstallReason.js'

/**
 * Why was this account created?
 * Stored in the account.
 */
export type CreationReason = InstallReason & {
  creationDate: Date
}

export type DiskCreationReason = DiskInstallReason & {
  creationDate: string
}

/**
 * Turns on-disk data into a CreationReason structure.
 */
export function unpackCreationReason (raw: DiskCreationReason): CreationReason {
  return {
    ...unpackInstallReason(raw),
    creationDate: asDate(raw.creationDate)
  }
}

/**
 * Turns a creation reason back into its on-disk format.
 */
export function packCreationReason (reason: CreationReason): DiskCreationReason {
  return {
    ...packInstallReason(reason),
    creationDate: reason.creationDate.toISOString()
  }
}
