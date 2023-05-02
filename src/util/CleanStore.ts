import { Cleaner, uncleaner } from 'cleaners'
import { navigateDisklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js'

import { ENV } from '../env'

interface CleanStoreRecord<T> {
  update: (data: T) => Promise<void>
  data: T
}

interface CleanStore {
  initRecord: <T>(key: string, cleaner: Cleaner<T>) => Promise<CleanStoreRecord<T>>
  getRecord: <T>(key: string, cleaner: Cleaner<T>) => Promise<CleanStoreRecord<T> | undefined>
  setRecord: <T>(key: string, data: T, cleaner: Cleaner<T>) => Promise<void>
}

const { debugStore } = ENV.ACTION_QUEUE

export const makeCleanStore = (account: EdgeAccount, storeId: string): CleanStore => {
  //
  // Private
  //

  function makeCleanStoreRecord<T>(key: string, data: T, cleaner: Cleaner<T>): CleanStoreRecord<T> {
    return {
      async update(data) {
        await instance.setRecord(key, data, cleaner)
      },
      data
    }
  }
  async function readData(key: string): Promise<string | null> {
    try {
      if (debugStore) {
        const disklet = navigateDisklet(account.localDisklet, storeId)
        return await disklet.getText(key)
      }
      return await account.dataStore.getItem(storeId, key)
    } catch (_: any) {
      return null
    }
  }
  async function writeData(key: string, data: string): Promise<void> {
    if (debugStore) {
      const disklet = navigateDisklet(account.localDisklet, storeId)
      await disklet.setText(key, data)
    }
    await account.dataStore.setItem(storeId, key, data)
  }

  //
  // Public
  //

  const instance: CleanStore = {
    async initRecord<T>(key: string, cleaner: Cleaner<T>): Promise<CleanStoreRecord<T>> {
      const record = await instance.getRecord(key, cleaner)
      if (record == null) {
        const data: T = cleaner(undefined)
        await instance.setRecord(key, data, cleaner)
        return makeCleanStoreRecord(key, data, cleaner)
      }
      return record
    },
    async getRecord<T>(key: string, cleaner: Cleaner<T>): Promise<CleanStoreRecord<T> | undefined> {
      const serializedData = await readData(key)
      if (serializedData == null) return
      try {
        const data = cleaner(serializedData)
        return makeCleanStoreRecord(key, data, cleaner)
      } catch (err: any) {
        throw new Error(`Failed to read '${key}' from CleanStore: ${String(err)}`)
      }
    },
    async setRecord<T>(key: string, data: T, cleaner: Cleaner<T>) {
      try {
        const serializedData = uncleaner(cleaner)(data)
        if (typeof serializedData !== 'string') {
          throw new Error(`Record ${key} in store ${storeId} must serialize to a string`)
        }
        await writeData(key, serializedData)
      } catch (error: any) {
        console.error(`Failed to write to CleanStore:`, { key, data })
        throw error
      }
    }
  }

  return instance
}
