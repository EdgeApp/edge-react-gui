/**
 * Route registration.
 *
 * Every call is declared with `route(…)`, which records it in a registry, so
 * importing the module is all the registration a route needs.
 */
import './account'
import './admin'
import './context'
import './credentials'
import './dataStore'
import './events'
import './keys'
import './lobby'
import './localSettings'
import './login'
import './otp'
import './rates'
import './spend'
import './status'
import './swap'
import './tokens'
import './transactions'
import './uri'
import './vouchers'
import './wallets'

import { allRoutes, registerRoute } from '../route'
import type { Router } from '../router'

export function registerRoutes(router: Router): void {
  for (const spec of allRoutes()) registerRoute(router, spec)
}
