/**
 * Wait, in a module the CLI can load.
 *
 * `src/util/utils.ts`' `snooze` is the obvious home and is unreachable from
 * the CLI: that module pulls in the locales and the Redux selectors, which is
 * also why `raceTimeout.ts` and `withDeadline.ts` are leaves beside it.
 *
 * No imports, so nothing is dragged into either bundle by using it.
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, ms))
}
