import { withAbortSignal } from '../../../hooks/useAbortable'

let currentSignal: AbortSignal | null = null
let currentController: AbortController | null = null
let cleanupCallback: (() => void) | null = null

export const setApprovalAbortSignal = (signal: AbortSignal | null): void => {
  currentSignal = signal
}

export const isApprovalAborted = (): boolean => {
  return currentSignal != null ? currentSignal.aborted : false
}

export const shouldAllowApprovalSideEffects = (): boolean => {
  if (currentSignal == null) return true
  return !currentSignal.aborted
}

// Begin a new approval scope, aborting any existing scope first. Returns the AbortSignal.
export const beginApproval = (): AbortSignal => {
  // Abort any existing scope
  if (currentController != null) {
    abortApproval()
  }
  currentController = new AbortController()
  currentSignal = currentController.signal
  return currentSignal
}

// Register a cleanup callback (e.g., provider quote close) to run on abort.
export const setApprovalCleanup = (cleanup: (() => void) | null): void => {
  cleanupCallback = cleanup
}

// Abort the active approval scope and run cleanup if present.
export const abortApproval = (): void => {
  if (currentController != null) {
    try {
      currentController.abort()
    } catch {}
  }
  if (cleanupCallback != null) {
    try {
      cleanupCallback()
    } catch {}
    cleanupCallback = null
  }
}

// Clear the active approval scope entirely (signal/controller/cleanup).
export const clearApproval = (): void => {
  currentController = null
  currentSignal = null
  cleanupCallback = null
}

// Get the current approval AbortSignal, if any.
export const getApprovalSignal = (): AbortSignal | null => currentSignal

// Wrap a promise with the current approval signal for early rejection.
export const runWithApproval = async <T>(promise: Promise<T>): Promise<T> => {
  if (currentSignal == null) return await promise
  return await withAbortSignal(promise, currentSignal)
}
