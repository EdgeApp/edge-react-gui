import { CONFIG } from '../config'

export const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
export const INFO_TEST_SERVER = 'https://info-tester.edge.app'
export const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

export const isMaestro = (): boolean => CONFIG.ENABLE_MAESTRO_BUILD

/**
 * TEST BUILD ONLY. Hardcoded on for the `test-swiss` cheese so the build always
 * talks to the Maestro tester fleet, whatever `config.json` Jenkins generates.
 * Revert to the commented-out expression below before this reaches a PR:
 *
 *   (CONFIG.ENABLE_TEST_SERVERS == null && isMaestro()) ||
 *   CONFIG.ENABLE_TEST_SERVERS === true
 */
export const shouldUseTestServers = (): boolean => true
