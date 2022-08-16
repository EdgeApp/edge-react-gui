// @flow

import { type Cleaner, asEither, uncleaner } from 'cleaners'
import { navigateDisklet } from 'disklet'
import { type EdgeAccount } from 'edge-core-js'

import ENV from '../../../env'
import { type BorrowActionId } from '../../plugins/borrow-plugins/types'
import { useSelector } from '../../types/reactRedux'
import { filterUndefined } from '../../util/safeFilters'
import { asActionProgram, asActionProgramState } from './cleaners'
import { type ActionProgram, type ActionProgramState, type ActionQueueItem, type ActionQueueMap } from './types'

const { debugStore } = ENV.ACTION_QUEUE

export const ACTION_QUEUE_DATASTORE_ID = 'actionQueue'

export const asStoreItem = asEither<ActionProgram, ActionProgramState>(asActionProgram, asActionProgramState)
export type StoreItem = $Call<typeof asStoreItem>

export type ActionQueueStore = {
  createActionQueueItem(program: ActionProgram): Promise<ActionProgramState>,
  getActionQueueItem(programId: string): Promise<ActionQueueItem>,
  updateActionQueueItem(programState: ActionProgramState): Promise<void>,
  getActionQueueItems(): Promise<ActionQueueItem[]>,
  getActionQueueMap(): Promise<ActionQueueMap>
}

export const makeActionQueueStore = (account: EdgeAccount, deviceId: string): ActionQueueStore => {
  // Use localDisklet (unencrypted) for debuggin purposes
  const baseDisklet = debugStore ? account.localDisklet : account.disklet
  const disklet = navigateDisklet(baseDisklet, ACTION_QUEUE_DATASTORE_ID)

  async function persistToDisk(path: string, data: mixed, cleaner: Cleaner<any>) {
    try {
      const uncleanData = uncleaner(cleaner)(data)
      const serializedData = JSON.stringify(uncleanData)
      // console.log(`### WRITE ${path}`, serializedData)
      await disklet.setText(path, serializedData)
    } catch (error) {
      console.error(`Failed to write:`, { path, data })
      throw error
    }
  }
  async function readFromDisk<T>(path: string, cleaner: Cleaner<T>): Promise<T> {
    const serializedData = await disklet.getText(path)
    // console.log(`### READ ${path}`, serializedData)
    try {
      const uncleanData = JSON.parse(serializedData)
      return cleaner(uncleanData)
    } catch (err) {
      throw new Error(`Failed to read '${path}' from disk: ${String(err)}`)
    }
  }

  const instance: ActionQueueStore = {
    async createActionQueueItem(program: ActionProgram): Promise<ActionProgramState> {
      const { programId } = program

      // Initial program state
      const programState: ActionProgramState = {
        deviceId,
        programId: programId
      }

      // Save to disk
      await Promise.all([
        persistToDisk(`${programId}/ActionProgram`, program, asActionProgram),
        persistToDisk(`${programId}/ActionProgramState`, programState, asActionProgramState)
      ])

      // Return initial state
      return programState
    },
    async getActionQueueItem(programId: string): Promise<ActionQueueItem> {
      const program = await readFromDisk(`${programId}/ActionProgram`, asActionProgram)
      const state = await readFromDisk(`${programId}/ActionProgramState`, asActionProgramState)

      return {
        program,
        state
      }
    },
    async updateActionQueueItem(programState: ActionProgramState): Promise<void> {
      const { programId } = programState

      await persistToDisk(`${programId}/ActionProgramState`, programState, asActionProgramState)
    },
    async getActionQueueItems(): Promise<ActionQueueItem[]> {
      const listing = await disklet.list()
      const programIds = Object.entries(listing).reduce((ids, [id, type]) => (type === 'folder' ? [...ids, id] : ids), [])
      const promises = programIds.map(programId =>
        instance.getActionQueueItem(programId).catch(err => {
          // Silently fail on reads
          console.error(`Failed to get ActionQueueItem for '${programId}'`, { err })
        })
      )
      const items: ActionQueueItem[] = filterUndefined(await Promise.all(promises))

      return items
    },
    async getActionQueueMap(): Promise<ActionQueueMap> {
      const queueItems = await instance.getActionQueueItems()
      const filteredItems = queueItems.filter(item => item.state.effect?.type !== 'done')
      const queueMap = filteredItems.reduce((map, item) => ({ ...map, [item.program.programId]: item }), {})

      return queueMap
    }
  }
  return instance
}

export const useRunningActionQueueId = (borrowActionId: BorrowActionId, walletId: string) => {
  const actionQueue: ActionQueueMap = useSelector(state => state.actionQueue.queue)
  return Object.keys(actionQueue).find(programId => programId.includes(borrowActionId) && programId.includes(walletId))
}
