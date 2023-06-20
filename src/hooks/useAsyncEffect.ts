import * as React from 'react'

import { showError } from '../components/services/AirshipInstance'

type Cleanup = () => void
type AsyncEffect = () => Promise<Cleanup | undefined> | Promise<void>

interface State {
  closed: boolean
  dirty: boolean
  effect: AsyncEffect
  lastCleanup: Cleanup | undefined
  lastDeps: unknown[] | undefined
  running: boolean
}

/**
 * Runs an effect when its dependencies change, just like `useEffect`,
 * but awaits the returned promise before starting the next run.
 */
export function useAsyncEffect(effect: AsyncEffect, deps?: unknown[], tag?: string): void {
  const state = React.useRef<State>({
    closed: false,
    dirty: false,
    effect,
    lastCleanup: undefined,
    lastDeps: undefined,
    running: false
  })

  // Handle component unmount:
  React.useEffect(
    () => () => {
      state.current.closed = true
      wakeup(state.current, tag)
    },
    [tag]
  )

  // Check for differences:
  if (!matchDeps(deps, state.current.lastDeps)) state.current.dirty = true
  state.current.lastDeps = deps
  state.current.effect = effect
  wakeup(state.current)
}

/**
 * Returns true if the two deps arrays match.
 */
function matchDeps(a?: unknown[], b?: unknown[]): boolean {
  if (a == null || b == null) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; ++i) {
    if (!Object.is(a[i], b[i])) return false
  }
  return true
}

/**
 * Does the next thing based on the current state.
 */
function wakeup(state: State, tag?: string): void {
  // We can't do anything if the effect is already running:
  if (state.running) return

  // Run the cleanup, if we have one:
  if (state.closed || state.dirty) {
    if (state.lastCleanup != null) state.lastCleanup()
    state.lastCleanup = undefined
  }

  // Run the effect again, if needed:
  if (state.dirty) {
    state.dirty = false
    state.running = true
    // Leave the rendering thread before running the effect:
    Promise.resolve()
      .then(async () => await state.effect())
      .then(cleanup => {
        state.lastCleanup = cleanup ?? undefined
        state.running = false
        wakeup(state)
      })
      .catch(error => {
        showError(error, { tag })
        state.running = false
        wakeup(state)
      })
  }
}
