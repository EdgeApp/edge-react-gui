import { asEither, Cleaner, uncleaner } from 'cleaners'
import { navigateDisklet } from 'disklet'
import { EdgeAccount } from 'edge-core-js'

// @ts-expect-error
import ENV from '../../../env'
import { useSelector } from '../../types/reactRedux'
import { filterUndefined } from '../../util/safeFilters'
import { LoanProgramEdge, LoanProgramType } from '../loan-manager/store'
import { asActionProgram, asActionProgramState } from './cleaners'
import { checkEffectIsDone } from './runtime'
import { ActionProgram, ActionProgramState, ActionQueueItem, ActionQueueMap } from './types'

const { debugStore } = ENV.ACTION_QUEUE

export const ACTION_QUEUE_DATASTORE_ID = 'actionQueue'

// @ts-expect-error
export const asStoreItem = asEither<ActionProgram, ActionProgramState>(asActionProgram, asActionProgramState)
export type StoreItem = ReturnType<typeof asStoreItem>

export type ActionQueueStore = {
  createActionQueueItem: (program: ActionProgram) => Promise<ActionProgramState>
  getActionQueueItem: (programId: string) => Promise<ActionQueueItem>
  updateActionQueueItem: (programState: ActionProgramState) => Promise<void>
  getActionQueueItems: () => Promise<ActionQueueItem[]>
  getActionQueueMap: () => Promise<ActionQueueMap>
}

export const makeActionQueueStore = (account: EdgeAccount, clientId: string): ActionQueueStore => {
  // Use localDisklet (unencrypted) for debuggin purposes
  const baseDisklet = debugStore ? account.localDisklet : account.disklet
  const disklet = navigateDisklet(baseDisklet, ACTION_QUEUE_DATASTORE_ID)

  async function persistToDisk(path: string, data: unknown, cleaner: Cleaner<any>) {
    try {
      const uncleanData = uncleaner(cleaner)(data)
      const serializedData = JSON.stringify(uncleanData)
      // console.log(`### WRITE ${path}`, serializedData)
      await disklet.setText(path, serializedData)
    } catch (error: any) {
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
    } catch (err: any) {
      throw new Error(`Failed to read '${path}' from disk: ${String(err)}`)
    }
  }

  const instance: ActionQueueStore = {
    async createActionQueueItem(program: ActionProgram): Promise<ActionProgramState> {
      const { programId } = program

      // Initial program state
      const programState: ActionProgramState = {
        clientId,
        programId: programId,
        effective: true,
        executing: false,
        lastExecutionTime: 0,
        nextExecutionTime: 0
      }

      // Only add the mockMode field if environment is configured with the flag enabled
      if (ENV.ACTION_QUEUE.mockMode) program.mockMode = true

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

      return { program, state }
    },
    async updateActionQueueItem(programState: ActionProgramState): Promise<void> {
      const { programId } = programState

      await persistToDisk(`${programId}/ActionProgramState`, programState, asActionProgramState)
    },
    async getActionQueueItems(): Promise<ActionQueueItem[]> {
      const listing = await disklet.list()
      // @ts-expect-error
      const programIds = Object.entries(listing).reduce((ids, [id, type]) => (type === 'folder' ? [...ids, id] : ids), [])
      const promises = programIds.map(async programId =>
        instance.getActionQueueItem(programId).catch(err => {
          // Silently fail on reads
          console.error(`Failed to get ActionQueueItem for '${programId}'`, { err })
        })
      )
      // @ts-expect-error
      const items: ActionQueueItem[] = filterUndefined(await Promise.all(promises))

      return items
    },
    async getActionQueueMap(): Promise<ActionQueueMap> {
      const queueItems = await instance.getActionQueueItems()
      const filteredItems = queueItems.filter(item => !checkEffectIsDone(item.state.effect))
      const queueMap = filteredItems.reduce((map, item) => ({ ...map, [item.program.programId]: item }), {})

      return queueMap
    }
  }
  return instance
}

export const useRunningActionQueueId = (programType: LoanProgramType, walletId: string): string | undefined => {
  const actionQueueMap: ActionQueueMap = useSelector(state => state.actionQueue.queue)
  const loanAccount = useSelector(state => state.loanManager.loanAccounts[walletId])
  if (loanAccount == null) return

  const programEdge = loanAccount.programEdges.find((programEdge: LoanProgramEdge) => {
    if (programEdge.programType === programType) {
      const actionQueueItem = actionQueueMap[programEdge.programId]
      // @ts-expect-error
      return actionQueueItem != null && actionQueueItem.state?.effect !== 'done'
    }
    return false
  })

  return programEdge?.programId
}
