import * as React from 'react'

import ENV from '../../../env.json'
import { useRefresher } from '../../hooks/useRefresher'
import { defaultAccount } from '../../reducers/CoreReducer'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { fetchInfo } from '../../util/network'
import { asAssetOverrides, assetOverrides } from '../../util/serverState'
import { AccountCallbackManager } from './AccountCallbackManager'
import { ActionQueueService } from './ActionQueueService'
import { AutoLogout } from './AutoLogout'
import { ContactsLoader } from './ContactsLoader'
import { DeepLinkingManager } from './DeepLinkingManager'
import { EdgeContextCallbackManager } from './EdgeContextCallbackManager'
import { LoanManagerService } from './LoanManagerService'
import { NetworkActivity } from './NetworkActivity'
import { PasswordReminderService } from './PasswordReminderService'
import { PermissionsManager } from './PermissionsManager'
import { SortedWalletList } from './SortedWalletList'
import { WalletLifecycle } from './WalletLifecycle'

interface Props {
  navigation: NavigationBase
}

const REFRESH_INFO_SERVER_MS = 60000

/**
 * Provides various services to the application. These are non-visual components
 * which provide some background tasks and exterior functionality for the app.
 */
export function Services(props: Props) {
  const account = useSelector(state => (state.core.account !== defaultAccount ? state.core.account : undefined))
  const { navigation } = props

  const appId = config.appId ?? 'edge'

  useRefresher(
    async () => {
      try {
        const response = await fetchInfo(`v1/assetOverrides/${appId}`)
        if (!response.ok) {
          const text = await response.text()
          console.warn(`Failed to fetch assetOverrides: ${text}`)
          return
        }
        const replyJson = await response.json()
        const overrides = asAssetOverrides(replyJson)
        assetOverrides.disable = overrides.disable
      } catch (e: any) {
        console.warn(`Failed to fetch assetOverrides: ${e.message}`)
      }
    },
    undefined,
    REFRESH_INFO_SERVER_MS
  )

  return (
    <>
      {ENV.BETA_FEATURES ? <ActionQueueService /> : null}
      <AutoLogout />
      <ContactsLoader />
      <DeepLinkingManager navigation={navigation} />
      {account == null ? null : <AccountCallbackManager account={account} navigation={navigation} />}
      {account == null ? null : <SortedWalletList account={account} />}
      <EdgeContextCallbackManager navigation={navigation} />
      <PermissionsManager />
      {account == null ? null : <LoanManagerService account={account} />}
      <NetworkActivity />
      <PasswordReminderService />
      <WalletLifecycle />
    </>
  )
}
