// TEMPORARY profiling instrumentation for the slow drawer / balance toggle
// investigation. Do not merge. Everything logs to logcat under the
// ReactNativeJS tag with a "[perf]" prefix.

import * as React from 'react'

const counts = new Map<string, number>()
let drawerPressAt: number | undefined
let balanceTapAt: number | undefined

const now = (): number => performance.now()

export function perfLog(message: string): void {
  console.log(`[perf] t=${now().toFixed(1)} ${message}`)
}

/** Counts a render without logging it (for list rows). */
export function perfCount(id: string): void {
  counts.set(id, (counts.get(id) ?? 0) + 1)
}

function flushCounts(): string {
  const out = [...counts.keys()]
    .sort()
    .map(id => `${id}=${counts.get(id) ?? 0}`)
    .join(' ')
  counts.clear()
  return out === '' ? '(none)' : out
}

/**
 * Logs each render of a component, with the time from its render starting
 * to its layout effect. That span covers its subtree's render and the
 * commit, so it approximates what the render cost the JS thread.
 */
export function usePerfRender(id: string): void {
  const start = now()
  perfCount(id)
  React.useLayoutEffect(() => {
    perfLog(`render ${id} subtree=${(now() - start).toFixed(1)}ms`)
  })
}

// ---- Drawer ----

export function perfDrawerPress(): void {
  flushCounts()
  drawerPressAt = now()
  perfLog('drawer press')
}

/** Call from an effect on the drawer status. The drawer starts its spring
 * from an effect in this same commit, so this marks the animation start. */
export function perfDrawerEffect(isOpen: boolean): void {
  const since =
    drawerPressAt == null ? 'n/a' : `${(now() - drawerPressAt).toFixed(1)}ms`
  perfLog(
    `drawer ${
      isOpen ? 'open' : 'close'
    } effect: since press=${since} renders: ${flushCounts()}`
  )
  drawerPressAt = undefined
}

// ---- Balance toggle ----

export function perfBalanceTap(): void {
  flushCounts()
  balanceTapAt = now()
  perfLog('balance tap')
}

export function perfBalanceStep(step: string, startedAt: number): void {
  const since =
    balanceTapAt == null ? 'n/a' : `${(now() - balanceTapAt).toFixed(1)}ms`
  perfLog(
    `balance ${step} took=${(now() - startedAt).toFixed(
      1
    )}ms since tap=${since}`
  )
}

/** Call from a layout effect on the visibility flag. */
export function perfBalanceCommitted(isVisible: boolean): void {
  const since =
    balanceTapAt == null ? 'n/a' : `${(now() - balanceTapAt).toFixed(1)}ms`
  perfLog(
    `balance committed visible=${String(
      isVisible
    )} since tap=${since} renders: ${flushCounts()}`
  )
}

export const perfNow = now

// ---- JS thread lag ----
// Logs whenever a 50ms timer fires more than 100ms late, which shows how busy
// the JS thread is on this account even when nobody is touching the app.

const LAG_INTERVAL_MS = 50
const LAG_REPORT_MS = 100
let lastTick = now()
setInterval(() => {
  const t = now()
  const lag = t - lastTick - LAG_INTERVAL_MS
  lastTick = t
  if (lag > LAG_REPORT_MS) perfLog(`jsLag ${lag.toFixed(0)}ms`)
}, LAG_INTERVAL_MS)
