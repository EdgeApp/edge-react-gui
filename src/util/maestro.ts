import { ENV } from '../env'

export const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
export const INFO_TEST_SERVER = 'https://info-tester.edge.app'
export const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

export const isMaestro = (): boolean => ENV.ENABLE_MAESTRO_BUILD

/**
 * This test build always uses the tester login, info and sync hosts,
 * whatever `ENABLE_TEST_SERVERS` or the Maestro flag say.
 */
export const shouldUseTestServers = (): boolean => true
