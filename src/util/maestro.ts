import { CONFIG } from '../config'

export const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
export const INFO_TEST_SERVER = 'https://info-tester.edge.app'
export const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

export const isMaestro = (): boolean => CONFIG.ENABLE_MAESTRO_BUILD

/**
 * Maestro builds default to tester login/info/sync hosts unless
 * `ENABLE_TEST_SERVERS` explicitly disables them. Non-Maestro builds only
 * use tester hosts when `ENABLE_TEST_SERVERS` is true.
 */
export const shouldUseTestServers = (): boolean =>
  (CONFIG.ENABLE_TEST_SERVERS == null && isMaestro()) ||
  CONFIG.ENABLE_TEST_SERVERS === true
