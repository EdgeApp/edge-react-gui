import { Cleaner, uncleaner } from 'cleaners'
import { navigateDisklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js'

// @ts-expect-error
import ENV from '../../env'

type CleanStoreRecord<T> = {
  update: (data: T) => Promise<void>
  data: T
}

type CleanStore = {
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
    } catch (_) {
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
    // @ts-expect-error
    async initRecord<T>(key, cleaner: Cleaner<T>): Promise<CleanStoreRecord<T>> {
      const record = await instance.getRecord(key, cleaner)
      if (record == null) {
        // @ts-expect-error
        const data: T = cleaner()
        await instance.setRecord(key, data, cleaner)
        return makeCleanStoreRecord(key, data, cleaner)
      }
      return record
    },
    // @ts-expect-error
    async getRecord<T>(key, cleaner: Cleaner<T>): Promise<CleanStoreRecord<T> | undefined> {
      const serializedData = await readData(key)
      if (serializedData == null) return
      try {
        const data = cleaner(serializedData)
        return makeCleanStoreRecord(key, data, cleaner)
      } catch (err) {
        throw new Error(`Failed to read '${key}' from CleanStore: ${String(err)}`)
      }
    },
    // @ts-expect-error
    async setRecord<T>(key, data: T, cleaner: Cleaner<T>) {
      try {
        const serializedData = uncleaner(cleaner)(data)
        if (typeof serializedData !== 'string') {
          throw new Error(`Record ${key} in store ${storeId} must serialize to a string`)
        }
        await writeData(key, serializedData)
      } catch (error) {
        console.error(`Failed to write to CleanStore:`, { key, data })
        throw error
      }
    }
  }

  return instance
}
