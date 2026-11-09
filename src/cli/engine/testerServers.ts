/**
 * The tester fleet, re-exported for the daemon's own modules.
 *
 * The declaration lives in `src/util/` because `src/util/maestro.ts` needs
 * it and is reached from app code: the shipped React Native bundle must not
 * import out of the daemon's directory, which is the rule
 * `src/util/predicates.ts` states as the reason *it* sits there.
 *
 * Re-exported rather than moved outright, so the engine modules,
 * `src/cli/index.ts` and `scripts/testCli.ts` keep the path they read as the
 * daemon's, and there is still one declaration.
 */
export { isTesterConfig, TESTER_SERVERS } from '../../util/testerServers'
