import type { Router } from '../router'
import { registerAccountRoutes } from './account'
import { registerAdminRoutes } from './admin'
import { registerContextRoutes } from './context'
import { registerCredentialsRoutes } from './credentials'
import { registerDataStoreRoutes } from './dataStore'
import { registerKeysRoutes } from './keys'
import { registerLobbyRoutes } from './lobby'
import { registerLocalSettingsRoutes } from './localSettings'
import { registerLoginRoutes } from './login'
import { registerOtpRoutes } from './otp'
import { registerRatesRoutes } from './rates'
import { registerSpendRoutes } from './spend'
import { registerStatusRoutes } from './status'
import { registerSwapRoutes } from './swap'
import { registerTokenRoutes } from './tokens'
import { registerTransactionRoutes } from './transactions'
import { registerUriRoutes } from './uri'
import { registerVoucherRoutes } from './vouchers'
import { registerWalletsRoutes } from './wallets'

export function registerRoutes(router: Router): void {
  registerStatusRoutes(router)
  registerContextRoutes(router)
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
