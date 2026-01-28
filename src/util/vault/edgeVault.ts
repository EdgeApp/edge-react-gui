import { type Disklet, navigateDisklet } from 'disklet'

import { makeUuid } from '../rnUtils'
import { EDGE_VAULT_NAMESPACE, VAULT_SCHEMA_VERSION } from './edgeVaultKeys'
import type { EdgeVaultLogger } from './edgeVaultLogger'
import type {
  VaultAddressInfo,
  VaultBankAccountInfo,
  VaultPersonalInfo,
  VaultRecord,
  VaultRecordType
} from './edgeVaultTypes'
import {
  asVaultAddressRecord,
  asVaultBankAccountRecord,
  asVaultPersonalRecord,
  wasVaultAddressRecord,
  wasVaultBankAccountRecord,
  wasVaultPersonalRecord
} from './edgeVaultTypes'

export interface EdgeVaultConfig {
  disklet: Disklet
  logger?: EdgeVaultLogger
}

export interface EdgeVault {
  createPersonalInfo: (info: VaultPersonalInfo) => Promise<string>
  updatePersonalInfo: (uuid: string, info: VaultPersonalInfo) => Promise<void>
  getPersonalInfo: (uuid: string) => Promise<VaultPersonalInfo | null>
  createAddressInfo: (info: VaultAddressInfo) => Promise<string>
  updateAddressInfo: (uuid: string, info: VaultAddressInfo) => Promise<void>
  createBankAccountInfo: (info: VaultBankAccountInfo) => Promise<string>
  updateBankAccountInfo: (
    uuid: string,
    info: VaultBankAccountInfo
  ) => Promise<void>
  getUuid: (type: VaultRecordType, index: number) => Promise<string | null>
}

export const makeEdgeVault = (config: EdgeVaultConfig): EdgeVault => {
  const { disklet, logger } = config
  const vaultDisklet = navigateDisklet(disklet, EDGE_VAULT_NAMESPACE)
  const log: EdgeVaultLogger = logger ?? {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined
  }

  const getUuidsByType = async (type: VaultRecordType): Promise<string[]> => {
    const listing = await vaultDisklet.list(`${type}/`)
    const uuids = Object.keys(listing)
      .filter(path => listing[path] === 'file' && path.endsWith('.json'))
      .map(path => path.replace(`${type}/`, '').replace('.json', ''))
    return uuids
  }

  const getExistingRecord = async <
    T extends VaultPersonalInfo | VaultAddressInfo | VaultBankAccountInfo
  >(
    uuid: string,
    info: T
  ): Promise<VaultRecord<T> | undefined> => {
    let existingRecord: VaultRecord<T>
    const recordText = await vaultDisklet.getText(`${info.type}/${uuid}.json`)

    try {
      if (info.type === 'personalInfo') {
        existingRecord = asVaultPersonalRecord(recordText) as VaultRecord<T>
      } else if (info.type === 'addressInfo') {
        existingRecord = asVaultAddressRecord(recordText) as VaultRecord<T>
      } else {
        existingRecord = asVaultBankAccountRecord(recordText) as VaultRecord<T>
      }
    } catch (_) {
      // TODO: Remove this, and `undefined` from the return type, once
      // EdgeVault is stable and in production
      return undefined
    }

    return existingRecord
  }

  const makeRecord = async <
    T extends VaultPersonalInfo | VaultAddressInfo | VaultBankAccountInfo
  >(
    info: T,
    existingRecord?: VaultRecord<T>
  ): Promise<VaultRecord<T>> => {
    const now = new Date()
    const recordId = existingRecord?.recordId ?? (await makeUuid())
    const record: VaultRecord<T> = {
      recordId,
      metadata: {
        version: VAULT_SCHEMA_VERSION,
        createdAt: existingRecord?.metadata.createdAt ?? now,
        updatedAt: now
      },
      data: info
    }
    return record
  }

  return {
    createPersonalInfo: async info => {
      try {
        const record = await makeRecord(info)
        const json = wasVaultPersonalRecord(record)
        await vaultDisklet.setText(`${info.type}/${record.recordId}.json`, json)
        log.info(`Created ${info.type} record`, { id: record.recordId })
        return record.recordId
      } catch (error) {
        log.error(`Failed to create ${info.type} record`, { error })
        throw error
      }
    },
    updatePersonalInfo: async (uuid, info) => {
      try {
        const existingRecord = await getExistingRecord(uuid, info)
        const record = await makeRecord(info, existingRecord)
        const json = wasVaultPersonalRecord(record)
        await vaultDisklet.setText(`${info.type}/${record.recordId}.json`, json)
        log.info(`Updated ${info.type} record`, { id: record.recordId })
      } catch (error) {
        log.error(`Failed to update ${info.type} record`, { error, uuid })
        throw error
      }
    },
    getPersonalInfo: async uuid => {
      try {
        const recordText = await vaultDisklet.getText(
          `personalInfo/${uuid}.json`
        )
        const record = asVaultPersonalRecord(recordText)
        return record.data
      } catch (error) {
        log.error('Failed to get personalInfo record', { error, uuid })
        return null
      }
    },
    createAddressInfo: async info => {
      try {
        const record = await makeRecord(info)
        const json = wasVaultAddressRecord(record)
        await vaultDisklet.setText(`${info.type}/${record.recordId}.json`, json)
        log.info(`Created ${info.type} record`, { id: record.recordId })
        return record.recordId
      } catch (error) {
        log.error(`Failed to create ${info.type} record`, { error })
        throw error
      }
    },
    updateAddressInfo: async (uuid, info) => {
      try {
        const existingRecord = await getExistingRecord(uuid, info)
        const record = await makeRecord(info, existingRecord)
        const json = wasVaultAddressRecord(record)
        await vaultDisklet.setText(`${info.type}/${record.recordId}.json`, json)
        log.info(`Updated ${info.type} record`, { id: record.recordId })
      } catch (error) {
        log.error(`Failed to update ${info.type} record`, { error, uuid })
        throw error
      }
    },
    createBankAccountInfo: async info => {
      try {
        const record = await makeRecord(info)
        const json = wasVaultBankAccountRecord(record)
        await vaultDisklet.setText(`${info.type}/${record.recordId}.json`, json)
        log.info(`Created ${info.type} record`, { id: record.recordId })
        return record.recordId
      } catch (error) {
        log.error(`Failed to create ${info.type} record`, { error })
        throw error
      }
    },
    updateBankAccountInfo: async (uuid, info) => {
      try {
        const existingRecord = await getExistingRecord(uuid, info)
        const record = await makeRecord(info, existingRecord)
        const json = wasVaultBankAccountRecord(record)
        await vaultDisklet.setText(`${info.type}/${record.recordId}.json`, json)
        log.info(`Updated ${info.type} record`, { id: record.recordId })
      } catch (error) {
        log.error(`Failed to update ${info.type} record`, { error, uuid })
        throw error
      }
    },
    getUuid: async (type, index) => {
      const uuids = await getUuidsByType(type)
      const uuid = uuids[index]
      return uuid ?? null
    }
  }
}
