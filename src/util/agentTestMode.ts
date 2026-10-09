import { CONFIG } from '../config'

/**
 * True in builds that automated agents drive through UI flows
 * (`AGENT_TEST_MODE` in config.json). The app then skips the post-login
 * modals, the notification cards, and the LogBox warning toast, so a flow
 * meets the same screens on every launch.
 *
 * Independent of `isMaestro`, which belongs to the QA Maestro suite.
 */
export const isAgentTestMode = (): boolean => CONFIG.AGENT_TEST_MODE
