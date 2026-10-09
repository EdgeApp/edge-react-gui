/**
 * Wait, in a module the CLI can load.
 *
 * The same three lines were written out in `src/cli/commands/edge.ts`,
 * `src/cli/client/spawnEngine.ts` and `scripts/testCliSubscribe.ts`, byte
 * for byte. `src/util/utils.ts`' `snooze` is the obvious home and is
 * unreachable from the CLI: that module pulls in the locales and the Redux
 * selectors, which is the whole reason this branch extracted
 * `raceTimeout.ts` and `withDeadline.ts` as leaves beside it.
 *
 * No imports, so nothing is dragged into either bundle by using it.
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, ms))
}
