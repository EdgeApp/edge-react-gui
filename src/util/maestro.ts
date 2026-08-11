import { ENV } from '../env'

export const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
export const INFO_TEST_SERVER = 'https://info-tester.edge.app'
export const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

export const isMaestro = (): boolean => ENV.ENABLE_MAESTRO_BUILD

/**
 * Maestro builds default to tester login/info/sync hosts unless
 * `ENABLE_TEST_SERVERS` explicitly disables them. Non-Maestro builds only
 * use tester hosts when `ENABLE_TEST_SERVERS` is true.
 */
export const shouldUseTestServers = (): boolean =>
  (ENV.ENABLE_TEST_SERVERS == null && isMaestro()) ||
  ENV.ENABLE_TEST_SERVERS === true
