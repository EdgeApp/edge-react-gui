/**
 * Route registration.
 *
 * Converted modules declare their calls with `route(…)`, which records them in
 * a registry; importing the module is enough. Modules still using
 * `register*Routes(router)` are registered directly until they are converted.
 */
// Declaration-style modules: imported for their side effect.
import './context'
import './login'
import './keys'
import './dataStore'
import './credentials'
import './account'
import './otp'
import './rates'
import './uri'
import './tokens'
import './lobby'
import './vouchers'
import './localSettings'
import './status'

import { allRoutes, registerRoute } from '../route'
import type { Router } from '../router'
import { registerAdminRoutes } from './admin'
import { registerSpendRoutes } from './spend'
import { registerSwapRoutes } from './swap'
import { registerTransactionRoutes } from './transactions'
import { registerWalletsRoutes } from './wallets'

export function registerRoutes(router: Router): void {
  for (const spec of allRoutes()) registerRoute(router, spec)

  registerWalletsRoutes(router)
  registerTransactionRoutes(router)
  registerSpendRoutes(router)
  registerSwapRoutes(router)
  registerAdminRoutes(router)
}
