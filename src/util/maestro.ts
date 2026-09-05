import { CONFIG } from '../config'

export const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
export const INFO_TEST_SERVER = 'https://info-tester.edge.app'
export const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

export const isMaestro = (): boolean => CONFIG.ENABLE_MAESTRO_BUILD

/**
 * Forced on for this test build. `config.json` is not committed, so a cheese
 * build has no way to set `ENABLE_TEST_SERVERS`; hardcoding it here points
 * login, info and sync at the tester hosts above.
 *
 * The normal rule, restored by dropping this commit: Maestro builds default to
 * tester hosts unless `ENABLE_TEST_SERVERS` explicitly disables them, and
 * non-Maestro builds use tester hosts only when `ENABLE_TEST_SERVERS` is true.
 */
export const shouldUseTestServers = (): boolean => true
