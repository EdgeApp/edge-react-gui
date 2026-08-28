import { CONFIG } from '../config'

export const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
export const INFO_TEST_SERVER = 'https://info-tester.edge.app'
export const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

export const isMaestro = (): boolean => CONFIG.ENABLE_MAESTRO_BUILD

/**
 * Cheese/tester WIP: always use login-tester, info-tester, and sync-tester.
 */
export const shouldUseTestServers = (): boolean => true
