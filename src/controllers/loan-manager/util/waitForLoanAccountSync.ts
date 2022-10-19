import { BorrowEngine } from '../../../plugins/borrow-plugins/types'

// Wait for borrow engine to fully sync
export const waitForBorrowEngineSync = async (borrowEngine: BorrowEngine) => {
  await new Promise<void>(resolve => {
    if (borrowEngine.syncRatio >= 1) return resolve()
    borrowEngine.watch('syncRatio', syncRatio => {
      if (syncRatio >= 1) resolve()
    })
  })
}
