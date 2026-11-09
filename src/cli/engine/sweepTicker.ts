/**
 * The periodic sweep both engine stores run.
 *
 * `SessionStore` and `ObjectHandleStore` share this one factory, so the
 * interval and the failure reporting are decided once.
 */
import type { PeriodicTask } from '../../util/PeriodicTask'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { errorMessage } from './errors'
import { consoleReporter, type EngineReporter } from './logger'

/** How often a store looks for work that has aged out. */
export const SWEEP_INTERVAL_MS = 15_000

/**
 * A sweep that reports its failures.
 *
 * `makePeriodicTask` rather than `setInterval`: it measures the gap after the
 * task finishes rather than from a fixed tick, and `onError` puts a failure
 * in the log rather than discarding it.
 *
 * The caller passes the engine's reporter, so a failure reaches the engine
 * log: `console` reaches only `engine-startup.log`, which every ordinary stop
 * deletes.
 */
export function makeSweepTicker(
  label: string,
  sweep: () => Promise<void>,
  report: EngineReporter = consoleReporter
): PeriodicTask {
  return makePeriodicTask(sweep, SWEEP_INTERVAL_MS, {
    onError: error => {
      const message = errorMessage(error)
      report.warn(`${label} failed: ${message}`)
    }
  })
}
