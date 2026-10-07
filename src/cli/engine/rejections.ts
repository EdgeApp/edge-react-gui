import type { EngineLogger } from './logger'

/**
 * What the engine does with a promise nobody handled: log it and keep
 * running, as the Edge app does (React Native only warns). One plugin's late
 * RPC failure must not end every session in the engine.
 */
export function logUnhandledRejection(
  logger: Pick<EngineLogger, 'error'>,
  write: (line: string) => void = line => {
    console.error(line)
  }
): (reason: unknown) => void {
  return reason => {
    const message =
      reason instanceof Error
        ? reason.stack ?? reason.message
        : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason) ?? String(reason)
    write(`[edge-engine] Unhandled promise rejection: ${message}`)
    try {
      logger.error('Unhandled promise rejection', { error: message })
    } catch {
      // The logger itself may be what failed; the line above still went out.
    }
  }
}
