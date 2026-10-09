import { TESTER_SERVERS } from '../cli/engine/testerServers'
import { CONFIG } from '../config'

// One declaration of the fleet, in the leaf module that has no imports: the
// app's three constants and the CLI engine's `TESTER_SERVERS` named the same
// three hosts, so renaming one updated half the repository.
export const LOGIN_TEST_SERVER = TESTER_SERVERS.loginServer
export const INFO_TEST_SERVER = TESTER_SERVERS.infoServer
export const SYNC_TEST_SERVER = TESTER_SERVERS.syncServer[0]

export const isMaestro = (): boolean => CONFIG.ENABLE_MAESTRO_BUILD

/**
 * Maestro builds default to tester login/info/sync hosts unless
 * `ENABLE_TEST_SERVERS` explicitly disables them. Non-Maestro builds only
 * use tester hosts when `ENABLE_TEST_SERVERS` is true.
 */
export const shouldUseTestServers = (): boolean =>
  (CONFIG.ENABLE_TEST_SERVERS == null && isMaestro()) ||
  CONFIG.ENABLE_TEST_SERVERS === true
