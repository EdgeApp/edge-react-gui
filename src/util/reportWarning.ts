/**
 * Where the shared GUI/CLI modules report a failure they recovered from.
 *
 * These modules are free functions on both import graphs, so they cannot take
 * a reporter in a constructor the way `EventHub`, `SessionStore`,
 * `IdleShutdown` and `ObjectHandleStore` do — and threading one through
 * `getTxActionDisplayInfo` and its six callers would put a logger in the
 * signature of every display helper. `configureExchangeRates` already
 * established the alternative in this same corner: a module-level sink the
 * owner of the process sets once.
 *
 * It matters because `console` is not a log in the daemon.
 * `spawnEngine.ts` starts the engine with `stdio: ['ignore', logFd, logFd]`
 * pointed at `engine-startup.log`, and a clean stop unlinks that file — so
 * every one of these reports was written to something that would be deleted,
 * while `~/.edge-cli/logs/engine-<profile>.log`, the file an operator pastes
 * into a bug report, said nothing at all. A rates server that 500s makes
 * `fillTxsFiat` answer `0` for every date, so a `get-transactions` page and
 * every CSV, QBO and Bitwave file written from it carry no fiat value.
 *
 * Node-safe: no react-native, no Redux, no Airship.
 */

/** The GUI's behaviour, and the default for anything that sets nothing. */
let sink: (message: string) => void = message => {
  console.warn(message)
}

/**
 * Point the sink somewhere.
 *
 * `src/cli/engine/index.ts` calls this with the engine reporter beside the
 * other boot wiring, so these reports land in the engine log.
 */
export function configureWarningSink(report: (message: string) => void): void {
  sink = report
}

/** Report a recovered failure. The caller supplies the whole sentence. */
export function reportWarning(message: string): void {
  sink(message)
}
