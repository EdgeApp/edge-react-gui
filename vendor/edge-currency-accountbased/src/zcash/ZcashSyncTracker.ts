import type { EdgeSyncStatus } from 'edge-core-js/types'

import { SyncEngine, SyncTracker } from '../common/SyncTracker'

const THROTTLE_UPDATE_MS = 1000

/**
 * A sync status tracker that works block-by-block.
 */
export interface ZcashSyncTracker extends SyncTracker {
  updateProgress: (percent: number) => void
}

export function makeZcashSyncTracker(engine: SyncEngine): ZcashSyncTracker {
  let seenFirstUpdate = false
  let lastTotalRatio = 0
  let lastUpdate = new Date()

  const out: ZcashSyncTracker = {
    resetSync() {
      seenFirstUpdate = false
      lastTotalRatio = 0
      lastUpdate = new Date()
    },

    updateProgress(progressPercent: number): void {
      // We can't trust the first progress report from the sdks.
      // We'll take it if its 100 but otherwise we should toss it.
      if (!seenFirstUpdate) {
        seenFirstUpdate = true
        if (progressPercent !== 100) return
      }

      const status: EdgeSyncStatus = {
        totalRatio: progressPercent / 100
      }

      // Don't go backwards:
      if (status.totalRatio <= lastTotalRatio) return

      // Throttle updates:
      const now = new Date()
      if (
        status.totalRatio === 1 ||
        now.valueOf() - lastUpdate.valueOf() > THROTTLE_UPDATE_MS
      ) {
        engine.sendSyncStatus(status)
        lastTotalRatio = status.totalRatio
        lastUpdate = now
      }
    }
  }

  return out
}
