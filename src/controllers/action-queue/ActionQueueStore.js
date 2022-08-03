// @flow

import { asEither, asMaybe, uncleaner } from 'cleaners'
import { navigateDisklet } from 'disklet'
import { type EdgeAccount } from 'edge-core-js'

import { type BorrowActionId } from '../../plugins/borrow-plugins/types'
import { useSelector } from '../../types/reactRedux'
import { asActionProgram, asActionProgramState } from './cleaners'
import { type ActionProgram, type ActionProgramState, type ActionQueueMap } from './types'

export const ACTION_QUEUE_DATASTORE_ID = 'actionQueue'

export const asStoreItem = asEither<ActionProgram, ActionProgramState>(asActionProgram, asActionProgramState)
export type StoreItem = $Call<typeof asStoreItem>

export type ActionQueueStore = {
  set: (itemId: string, data: StoreItem) => Promise<void>,
  get: (itemId: string) => Promise<string>,
  list: () => Promise<string[]>,
  getActionQueueMap(): Promise<ActionQueueMap>
}

export const makeActionQueueStore = (account: EdgeAccount): ActionQueueStore => {
  const disklet = navigateDisklet(account.localDisklet, ACTION_QUEUE_DATASTORE_ID)

  const instance = {
    async set(itemId: string, data: StoreItem): Promise<void> {
      const uncleanData = uncleaner(asStoreItem)(data)
      const serializedData = JSON.stringify(uncleanData)
      await disklet.setText(itemId, serializedData)
    },
    async get(itemId: string): Promise<string> {
      return await disklet.getText(itemId)
    },
    async list() {
      const listing = await disklet.list()
      const filenames = Object.entries(listing).reduce((filenames, [name, type]) => (type === 'file' ? [...filenames, name] : filenames), [])
      return filenames
    },
    async getActionQueueMap(): Promise<ActionQueueMap> {
      const itemIds = await instance.list()

      const itemPromises: Promise<mixed>[] = itemIds.map(async itemId => {
        const item = await instance.get(itemId)
        try {
          return JSON.parse(item)
        } catch (err) {
          console.error(`Failed to JSON parse item in ActionQueueStore: ${itemId}`)
        }
      })

      const items = await Promise.all(itemPromises)
      const queue: ActionQueueMap = {}
      const programIds: string[] = []
      const programs: { [id: string]: ActionProgram } = {}
      const states: { [id: string]: ActionProgramState } = {}

      for (const item of items) {
        const actionProgram = asMaybe(asActionProgram)(item)
        if (actionProgram != null) {
          const programId = actionProgram.programId
          programs[programId] = actionProgram
          programIds.push(programId)
        }

        const actionProgramState = asMaybe(asActionProgramState)(item)
        if (actionProgramState != null) {
          const programId = actionProgramState.programId
          states[programId] = actionProgramState
          programIds.push(programId)
        }
      }

      for (const programId of programIds) {
        const program = programs[programId]
        const state = states[programId]

        if (program == null) {
          console.warn(`Missing program for '${programId}'`)
          continue
        }
        if (state == null) {
          console.warn(`Missing state for '${programId}'`)
          continue
        }
        if (state.effect?.type === 'done') {
          continue
        }

        queue[programId] = {
          program,
          state
        }
      }

      return queue
    }
  }
  return instance
}

// TODO: Sam's recommendation: Create separate map in redux to manage running borrow action programs?
export const useRunningActionQueueId = (borrowActionId: BorrowActionId) => {
  const actionQueue: ActionQueueMap = useSelector(state => state.actionQueue.queue)
  return Object.keys(actionQueue).find(programId => programId.includes('loan-create'))
}
