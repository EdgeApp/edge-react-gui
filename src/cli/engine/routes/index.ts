/**
 * Route registration.
 *
 * Converted modules declare their calls with `route(…)`, which records them in
 * a registry; importing the module is enough. Modules still using
 * `register*Routes(router)` are registered directly until they are converted.
 */
// Declaration-style modules: imported for their side effect.
import './context'
import './status'

import { allRoutes, registerRoute } from '../route'
import type { Router } from '../router'
import { registerAccountRoutes } from './account'
import { registerAdminRoutes } from './admin'
import { registerCredentialsRoutes } from './credentials'
import { registerDataStoreRoutes } from './dataStore'
import { registerKeysRoutes } from './keys'
import { registerLobbyRoutes } from './lobby'
import { registerLocalSettingsRoutes } from './localSettings'
import { registerLoginRoutes } from './login'
import { registerOtpRoutes } from './otp'
import { registerRatesRoutes } from './rates'
import { registerSpendRoutes } from './spend'
import { registerSwapRoutes } from './swap'
import { registerTokenRoutes } from './tokens'
import { registerTransactionRoutes } from './transactions'
import { registerUriRoutes } from './uri'
import { registerVoucherRoutes } from './vouchers'
import { registerWalletsRoutes } from './wallets'

export function registerRoutes(router: Router): void {
  for (const spec of allRoutes()) registerRoute(router, spec)

  registerLoginRoutes(router)
  registerAccountRoutes(router)
  registerLocalSettingsRoutes(router)
  registerCredentialsRoutes(router)
  registerOtpRoutes(router)
  registerVoucherRoutes(router)
  registerLobbyRoutes(router)
  registerKeysRoutes(router)
  registerDataStoreRoutes(router)
  registerWalletsRoutes(router)
  registerTransactionRoutes(router)
  registerSpendRoutes(router)
  registerSwapRoutes(router)
  registerRatesRoutes(router)
  registerTokenRoutes(router)
  registerUriRoutes(router)
  registerAdminRoutes(router)
}
