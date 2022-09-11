import { makeReactNativeDisklet } from 'disklet'
import { EdgeAccount, EdgeContext } from 'edge-core-js/types'
import { LoginUiProvider } from 'edge-login-ui-rn'
import * as React from 'react'
import { MenuProvider } from 'react-native-popup-menu'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore, Middleware } from 'redux'
import thunk from 'redux-thunk'

import ENV from '../../../env.json'
import { loadDeviceReferral } from '../../actions/DeviceReferralActions'
import { rootReducer } from '../../reducers/RootReducer'
import { useEffect, useState } from '../../types/reactHooks'
import { Action } from '../../types/reduxActions'
import { Dispatch, RootState } from '../../types/reduxTypes'
import { errorAlert } from '../../util/middleware/errorAlert'
import { loginStatusChecker } from '../../util/middleware/loginStatusChecker'
import { perfLogger } from '../../util/middleware/perfLogger'
import { Main } from '../Main.ui'
import { AccountCallbackManager } from './AccountCallbackManager'
import { ActionQueueService } from './ActionQueueService'
import { Airship } from './AirshipInstance'
import { AutoLogout } from './AutoLogout'
import { ContactsLoader } from './ContactsLoader'
import { DeepLinkingManager } from './DeepLinkingManager'
import { EdgeContextCallbackManager } from './EdgeContextCallbackManager'
import { LoanManagerService } from './LoanManagerService'
import { NetworkActivity } from './NetworkActivity'
import { PasswordReminderService } from './PasswordReminderService'
import { PermissionsManager } from './PermissionsManager'
import { SortedWalletList } from './SortedWalletList'
import { useTheme } from './ThemeContext'
import { WalletLifecycle } from './WalletLifecycle'

type Props = { context: EdgeContext }

/**
 * Provides various global services to the application,
 * including the Redux store, pop-up menus, modals, etc.
 */
export function Services(props: Props) {
  const { context } = props
  const [account, setAccount] = useState<EdgeAccount | undefined>()
  const theme = useTheme()

  // The `useRef` hook might make more sense, but it requires an initial value,
  // and we don't want to create dummy stores on each render.
  // The `useState` hook lets us pass an initializer that only runs once:
  const [store] = useState(() => {
    const middleware: Array<Middleware<RootState, Action>> = [errorAlert, loginStatusChecker, thunk]
    // @ts-expect-error
    if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

    // @ts-expect-error
    if (global.__DEV__) {
      const createDebugger = require('redux-flipper').default
      middleware.push(createDebugger())
    }

    // @ts-expect-error
    const store = createStore<RootState, Action, Dispatch>(rootReducer, undefined, applyMiddleware(...middleware))

    // Put the context into Redux:
    const disklet = makeReactNativeDisklet()
    store.dispatch({
      type: 'CORE/CONTEXT/ADD_CONTEXT',
      data: { context, disklet }
    })

    // Watch the account:
    store.subscribe(() => {
      const newAccount = store.getState().core.account
      if (newAccount !== account) {
        setAccount(newAccount.watch == null ? undefined : newAccount)
      }
    })

    return store
  })

  // Actions to perform at first login:
  useEffect(() => {
    // @ts-expect-error
    store.dispatch(loadDeviceReferral())
  }, [store])

  return (
    <Provider store={store}>
      {/* @ts-expect-error */}
      <LoginUiProvider themeOverride={theme}>
        <MenuProvider>
          <Airship>
            <Main />
          </Airship>
        </MenuProvider>
        {/* @ts-expect-error */}
        {ENV.BETA_FEATURES ? <ActionQueueService /> : null}
        <AutoLogout />
        <ContactsLoader />
        <DeepLinkingManager />
        {account == null ? null : <AccountCallbackManager account={account} />}
        {account == null ? null : <SortedWalletList account={account} />}
        <EdgeContextCallbackManager />
        <PermissionsManager />
        <LoanManagerService />
        <NetworkActivity />
        <PasswordReminderService />
        <WalletLifecycle />
      </LoginUiProvider>
    </Provider>
  )
}
