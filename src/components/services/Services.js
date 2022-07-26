// @flow

import { makeReactNativeDisklet } from 'disklet'
import { type EdgeAccount, type EdgeContext } from 'edge-core-js/types'
import { LoginUiProvider } from 'edge-login-ui-rn'
import * as React from 'react'
import { MenuProvider } from 'react-native-popup-menu'
import { Provider } from 'react-redux'
import { type Middleware, applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'

import ENV from '../../../env.json'
import { loadDeviceReferral } from '../../actions/DeviceReferralActions.js'
import { rootReducer } from '../../reducers/RootReducer.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { type Action } from '../../types/reduxActions.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { errorAlert } from '../../util/middleware/errorAlert.js'
import { loginStatusChecker } from '../../util/middleware/loginStatusChecker.js'
import { perfLogger } from '../../util/middleware/perfLogger.js'
import { Main } from '../Main.ui.js'
import { AccountCallbackManager } from './AccountCallbackManager.js'
import { Airship } from './AirshipInstance.js'
import { AutoLogout } from './AutoLogout.js'
import { ContactsLoader } from './ContactsLoader.js'
import { DeepLinkingManager } from './DeepLinkingManager.js'
import { EdgeContextCallbackManager } from './EdgeContextCallbackManager.js'
import { NetworkActivity } from './NetworkActivity.js'
import { PasswordReminderService } from './PasswordReminderService.js'
import { PermissionsManager } from './PermissionsManager.js'
import { SortedWalletList } from './SortedWalletList.js'
import { useTheme } from './ThemeContext'
import { WalletLifecycle } from './WalletLifecycle.js'

type Props = { context: EdgeContext }

/**
 * Provides various global services to the application,
 * including the Redux store, pop-up menus, modals, etc.
 */
export function Services(props: Props) {
  const { context } = props
  const [account, setAccount] = useState<EdgeAccount | void>()
  const theme = useTheme()

  // The `useRef` hook might make more sense, but it requires an initial value,
  // and we don't want to create dummy stores on each render.
  // The `useState` hook lets us pass an initializer that only runs once:
  const [store] = useState(() => {
    const middleware: Middleware<RootState, Action>[] = [errorAlert, loginStatusChecker, thunk]
    if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

    if (global.__DEV__) {
      const createDebugger = require('redux-flipper').default
      middleware.push(createDebugger())
    }

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
    store.dispatch(loadDeviceReferral())
  }, [store])

  return (
    <Provider store={store}>
      <MenuProvider>
        <Airship>
          <Main />
        </Airship>
      </MenuProvider>
      <AutoLogout />
      <ContactsLoader />
      <DeepLinkingManager />
      {account == null ? null : <AccountCallbackManager account={account} />}
      {account == null ? null : <SortedWalletList account={account} />}
      <EdgeContextCallbackManager />
      <PermissionsManager />
      <NetworkActivity />
      <PasswordReminderService />
      <WalletLifecycle />
    </Provider>
  )
}
