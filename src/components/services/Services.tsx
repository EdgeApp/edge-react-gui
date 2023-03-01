import * as React from 'react'

import { updateExchangeInfo } from '../../actions/ExchangeInfoActions'
import { checkCompromisedKeys } from '../../actions/WalletActions'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useRefresher } from '../../hooks/useRefresher'
import { makeStakePlugins } from '../../plugins/stake-plugins/stakePlugins'
import { defaultAccount } from '../../reducers/CoreReducer'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { updateAssetOverrides } from '../../util/serverState'
import { snooze } from '../../util/utils'
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
import { WipeLogsService } from './WipeLogsService'

interface Props {
  navigation: NavigationBase
}

const REFRESH_INFO_SERVER_MS = 60000

/**
 * Provides various services to the application. These are non-visual components
 * which provide some background tasks and exterior functionality for the app.
 */
export function Services(props: Props) {
  const dispatch = useDispatch()
  const account = useSelector(state => (state.core.account !== defaultAccount ? state.core.account : undefined))
  const { navigation } = props

  // Methods to call once all of the currency wallets have been loaded
  useAsyncEffect(async () => {
    if (account?.waitForAllWallets == null) return
    await account.waitForAllWallets()

    // HACK: The balances object isn't full when the above promise resolves so we need to wait a few seconds before proceeding
    await snooze(5000)
    dispatch(checkCompromisedKeys(navigation))
  }, [account])

  // Methods to call periodically
  useRefresher(
    async () => {
      makeStakePlugins().catch(() => {})
      updateAssetOverrides()
      dispatch(updateExchangeInfo())
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
      <WipeLogsService />
    </>
  )
}
