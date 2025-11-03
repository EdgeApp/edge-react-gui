import type { Cleaner, Uncleaner } from 'cleaners'
import {
  asDate,
  asJSON,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue,
  uncleaner
} from 'cleaners'

export interface VaultNameField {
  firstName: string
  middleName?: string
  lastName: string
}

export interface VaultPersonalInfo {
  type: 'personalInfo'
  email: string
  name: VaultNameField
}

export interface VaultAddressInfo {
  type: 'addressInfo'
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  countryCode: string
}

export interface VaultBankAccountInfo {
  type: 'bankAccountInfo'
  bankName: string
  ownerName: VaultNameField
  accountName: string
  accountNumber: string
  routingNumber: string
}

export type VaultPayload =
  | VaultPersonalInfo
  | VaultAddressInfo
  | VaultBankAccountInfo

export interface VaultMetadata {
  version: number
  createdAt: Date
  updatedAt: Date
}

export interface VaultRecord<T extends VaultPayload> {
  recordId: string
  metadata: VaultMetadata
  data: T
}

export type VaultRecordType = 'personalInfo' | 'addressInfo' | 'bankAccountInfo'

export const asVaultNameField: Cleaner<VaultNameField> = asObject({
  firstName: asString,
  middleName: asOptional(asString),
  lastName: asString
})

export const asVaultPersonalInfo: Cleaner<VaultPersonalInfo> = asJSON(
  asObject({
    type: asValue('personalInfo'),
    email: asString,
    name: asVaultNameField
  })
)

export const wasVaultPersonalInfo: Uncleaner<VaultPersonalInfo> =
  uncleaner(asVaultPersonalInfo)

export const asVaultAddressInfo: Cleaner<VaultAddressInfo> = asJSON(
  asObject({
    type: asValue('addressInfo'),
    line1: asString,
    line2: asOptional(asString),
    city: asString,
    state: asString,
    postalCode: asString,
    countryCode: asString
  })
)

export const wasVaultAddressInfo: Uncleaner<VaultAddressInfo> =
  uncleaner(asVaultAddressInfo)

export const asVaultBankAccountInfo: Cleaner<VaultBankAccountInfo> = asJSON(
  asObject({
    type: asValue('bankAccountInfo'),
    bankName: asString,
    ownerName: asVaultNameField,
    accountName: asString,
    accountNumber: asString,
    routingNumber: asString
  })
)

export const wasVaultBankAccountInfo: Uncleaner<VaultBankAccountInfo> =
  uncleaner(asVaultBankAccountInfo)

export const asVaultMetadata: Cleaner<VaultMetadata> = asJSON(
  asObject({
    version: asNumber,
    createdAt: asDate,
    updatedAt: asDate
  })
)

export const wasVaultMetadata: Uncleaner<VaultMetadata> =
  uncleaner(asVaultMetadata)

export const asVaultRecord = <T extends VaultPayload>(
  asData: Cleaner<T>
): Cleaner<VaultRecord<T>> =>
  asJSON(
    asObject({
      recordId: asString,
      metadata: asVaultMetadata,
      data: asData
    })
  )

export const wasVaultRecord = <T extends VaultPayload>(
  asCleaner: Cleaner<VaultRecord<T>>
): Uncleaner<VaultRecord<T>> => uncleaner(asCleaner)

export const asVaultPersonalRecord: Cleaner<VaultRecord<VaultPersonalInfo>> =
  asVaultRecord(asVaultPersonalInfo)

export const wasVaultPersonalRecord: Uncleaner<VaultRecord<VaultPersonalInfo>> =
  wasVaultRecord(asVaultPersonalRecord)

export const asVaultAddressRecord: Cleaner<VaultRecord<VaultAddressInfo>> =
  asVaultRecord(asVaultAddressInfo)

export const wasVaultAddressRecord: Uncleaner<VaultRecord<VaultAddressInfo>> =
  wasVaultRecord(asVaultAddressRecord)

export const asVaultBankAccountRecord: Cleaner<
  VaultRecord<VaultBankAccountInfo>
> = asVaultRecord(asVaultBankAccountInfo)

export const wasVaultBankAccountRecord: Uncleaner<
  VaultRecord<VaultBankAccountInfo>
> = wasVaultRecord(asVaultBankAccountRecord)
