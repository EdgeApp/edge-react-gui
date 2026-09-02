/**
 * The assembled Edge CLI API surface.
 *
 * Group order here is the order sections appear in the rendered docs and in
 * the generated OpenAPI document.
 */
import { accountGroup } from './endpoints/account'
import { adminGroup } from './endpoints/admin'
import { contextGroup } from './endpoints/context'
import { credentialsGroup } from './endpoints/credentials'
import { dataStoreGroup } from './endpoints/dataStore'
import { keysGroup } from './endpoints/keys'
import { loginGroup } from './endpoints/login'
import { lobbyGroup, otpGroup, vouchersGroup } from './endpoints/otp'
import { ratesGroup } from './endpoints/rates'
import { spendGroup } from './endpoints/spend'
import { engineGroup } from './endpoints/status'
import { swapGroup } from './endpoints/swap'
import { tokensGroup } from './endpoints/tokens'
import { transactionsGroup } from './endpoints/transactions'
import { uriGroup } from './endpoints/uri'
import { walletsGroup } from './endpoints/wallets'
import type { Endpoint, EndpointGroup } from './types'

export const groups: EndpointGroup[] = [
  engineGroup,
  contextGroup,
  loginGroup,
  accountGroup,
  credentialsGroup,
  otpGroup,
  vouchersGroup,
  lobbyGroup,
  keysGroup,
  walletsGroup,
  tokensGroup,
  transactionsGroup,
  spendGroup,
  swapGroup,
  uriGroup,
  ratesGroup,
  dataStoreGroup,
  adminGroup
]

export const endpoints: Endpoint[] = groups.flatMap(g => g.endpoints)

export { schemas, errorCodes, CLI_EXIT_CODES } from './shared'
