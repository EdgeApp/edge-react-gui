import { CONFIG } from '../config'

export const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
export const INFO_TEST_SERVER = 'https://info-tester.edge.app'
export const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

export const isMaestro = (): boolean => CONFIG.ENABLE_MAESTRO_BUILD

/**
 * Forced on for this test build: every build uses the tester login/info/sync
 * hosts regardless of `ENABLE_MAESTRO_BUILD` or `ENABLE_TEST_SERVERS`.
 */
export const shouldUseTestServers = (): boolean => true
