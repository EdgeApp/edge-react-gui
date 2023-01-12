import { makeReactNativeDisklet } from 'disklet'
import { EdgeAccount, EdgeContext } from 'edge-core-js/types'
import { LoginUiProvider } from 'edge-login-ui-rn'
import * as React from 'react'
import { MenuProvider } from 'react-native-popup-menu'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'

import ENV from '../../../env.json'
import { loadDeviceReferral } from '../../actions/DeviceReferralActions'
import { useRefresher } from '../../hooks/useRefresher'
import { rootReducer } from '../../reducers/RootReducer'
import { config } from '../../theme/appConfig'
import { Dispatch, RootState, Store } from '../../types/reduxTypes'
import { errorAlert } from '../../util/middleware/errorAlert'
import { loginStatusChecker } from '../../util/middleware/loginStatusChecker'
import { perfLogger } from '../../util/middleware/perfLogger'
import { fetchInfo } from '../../util/network'
import { asAssetOverrides, assetOverrides } from '../../util/serverState'
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

interface Props {
  context: EdgeContext
}

const REFRESH_INFO_SERVER_MS = 60000

/**
 * Provides various global providers to the application,
 * including the Redux store, pop-up menus, modals, etc.
 */
export function Providers(props: Props) {
  const { context } = props
  const [account, setAccount] = React.useState<EdgeAccount | undefined>()
  const theme = useTheme()
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

  // The `useRef` hook might make more sense, but it requires an initial value,
  // and we don't want to create dummy stores on each render.
  // The `useState` hook lets us pass an initializer that only runs once:
  const [store] = React.useState<Store>(() => {
    const middleware = [errorAlert, loginStatusChecker, thunk]
    if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

    if (__DEV__) {
      const createDebugger = require('redux-flipper').default
      middleware.push(createDebugger())
    }

    const enhancer = applyMiddleware<Dispatch, RootState>(...middleware)
    const store = createStore(rootReducer, undefined, enhancer)

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

  // Actions to perform at startup:
  React.useEffect(() => {
    store.dispatch(loadDeviceReferral())
  }, [store])

  return (
    <Provider store={store}>
      <LoginUiProvider
        // @ts-expect-error
        themeOverride={theme}
      >
        <MenuProvider>
          <Airship>
            <Main />
          </Airship>
        </MenuProvider>
        {ENV.BETA_FEATURES ? <ActionQueueService /> : null}
        <AutoLogout />
        <ContactsLoader />
        <DeepLinkingManager />
        {account == null ? null : <AccountCallbackManager account={account} />}
        {account == null ? null : <SortedWalletList account={account} />}
        <EdgeContextCallbackManager />
        <PermissionsManager />
        {account == null ? null : <LoanManagerService account={account} />}
        <NetworkActivity />
        <PasswordReminderService />
        <WalletLifecycle />
      </LoginUiProvider>
    </Provider>
  )
}
