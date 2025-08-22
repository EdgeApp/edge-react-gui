import type { EdgeDataStore } from 'edge-core-js'

export interface RampPluginStore {
  readonly deleteItem: (itemId: string) => Promise<void>
  readonly listItemIds: () => Promise<string[]>
  readonly getItem: (itemId: string) => Promise<string>
  readonly setItem: (itemId: string, value: string) => Promise<void>
}

export const createStore = (
  storeId: string,
  store: EdgeDataStore
): RampPluginStore => {
  return {
    deleteItem: async (itemId: string) => {
      await store.deleteItem(storeId, itemId)
    },
    listItemIds: async () => await store.listItemIds(storeId),
    getItem: async (itemId: string) => await store.getItem(storeId, itemId),
    setItem: async (itemId: string, value: string) => {
      await store.setItem(storeId, itemId, value)
    }
  }
}
