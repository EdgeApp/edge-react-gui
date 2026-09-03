/**
 * Route registration.
 *
 * Every call is declared with `route(…)`, which records it in a registry, so
 * importing the module is all the registration a route needs.
 */
import './account'
import './context'
import './events'
import './login'
import './objects'
import './status'

import { allRoutes, registerRoute } from '../route'
import type { Router } from '../router'

export function registerRoutes(router: Router): void {
  for (const spec of allRoutes()) registerRoute(router, spec)
}
