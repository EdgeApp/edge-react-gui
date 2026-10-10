/**
 * Node's timer ceiling, in one import-free leaf.
 *
 * `setTimeout` holds its delay in a signed 32-bit integer, so a delay above
 * this warns `TimeoutOverflowWarning` and fires after **1 ms** — the
 * opposite of what the caller asked for, which is why four places refuse
 * against it: `engineArgs.ts`'s `--idle-timeout`, `schemas.ts`'s
 * `asMinSeconds`, `requestBudget.ts`'s budget header, and
 * `client/clientArgs.ts`'s `--timeout`. Before the ceiling, a seconds field
 * converted with `* 1000` inverted at the top of its range:
 * `--idle-timeout=2592000` shut the engine down the instant it went idle,
 * and `admin-make-lobby --period-seconds=30000000` polled Edge's production
 * login server every millisecond. The value was declared twice, once in
 * `schemas.ts` and once in `requestBudget.ts` whose comment said out loud
 * that it was "the same one `schemas.ts` refuses above".
 *
 * Here rather than in `schemas.ts`, because `requestBudget.ts` and the
 * client have to stay off the engine's module graph: `schemas.ts` pulls in
 * `cleaners` and `edge-core-js`.
 */
export const MAX_TIMER_MS = 2 ** 31 - 1
