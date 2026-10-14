import { CONFIG } from '../config'
import { TESTER_SERVERS } from './testerServers'

// One declaration of the fleet, in the leaf module that has no imports: the
// app's three constants and the CLI engine's `TESTER_SERVERS` named the same
// three hosts, so renaming one updated half the repository.
export const LOGIN_TEST_SERVER = TESTER_SERVERS.loginServer
export const INFO_TEST_SERVER = TESTER_SERVERS.infoServer
export const SYNC_TEST_SERVER = TESTER_SERVERS.syncServer[0]

export const isMaestro = (): boolean => CONFIG.ENABLE_MAESTRO_BUILD

/**
 * This test build always uses the tester login, info and sync hosts,
 * whatever `ENABLE_TEST_SERVERS` or the Maestro flag say.
 */
export const shouldUseTestServers = (): boolean => true
