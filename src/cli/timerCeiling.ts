/**
 * Node's timer ceiling, in one import-free leaf.
 *
 * `setTimeout` holds its delay in a signed 32-bit integer, so a delay above
 * this warns `TimeoutOverflowWarning` and fires after **1 ms** — the
 * opposite of what the caller asked for, which is why three places refuse
 * or clamp against it: `engineArgs.ts`'s `--idle-timeout`,
 * `schemas.ts`'s `asMinSeconds`, and `requestBudget.ts`'s budget header
 * and `--timeout`. The value was declared twice, once in `schemas.ts` as
 * `MAX_TIMER_MS` and once in `requestBudget.ts` whose comment said out loud
 * that it was "the same one `schemas.ts` refuses above".
 *
 * Here rather than in `schemas.ts`, because `requestBudget.ts` and the
 * client have to stay off the engine's module graph: `schemas.ts` pulls in
 * `cleaners` and `edge-core-js`.
 */
export const MAX_TIMER_MS = 2 ** 31 - 1
