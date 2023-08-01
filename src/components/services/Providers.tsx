import { makeReactNativeDisklet } from 'disklet'
import { EdgeContext } from 'edge-core-js/types'
import { LoginUiProvider } from 'edge-login-ui-rn'
import * as React from 'react'
import { MenuProvider } from 'react-native-popup-menu'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'

import { loadDeviceReferral } from '../../actions/DeviceReferralActions'
import { ENV } from '../../env'
import { rootReducer } from '../../reducers/RootReducer'
import { Dispatch, RootState, Store } from '../../types/reduxTypes'
import { loginStatusChecker } from '../../util/middleware/loginStatusChecker'
import { perfLogger } from '../../util/middleware/perfLogger'
import { Main } from '../Main'
import { Airship } from './AirshipInstance'
import { useTheme } from './ThemeContext'

interface Props {
  context: EdgeContext
}

/**
 * Provides various global providers to the application,
 * including the Redux store, pop-up menus, modals, etc.
 */
export function Providers(props: Props) {
  const { context } = props
  const theme = useTheme()

  // The `useRef` hook might make more sense, but it requires an initial value,
  // and we don't want to create dummy stores on each render.
  // The `useState` hook lets us pass an initializer that only runs once:
  const [store] = React.useState<Store>(() => {
    const middleware = [loginStatusChecker, thunk]
    if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

    if (__DEV__) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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

    return store
  })

  // Actions to perform at startup:
  React.useEffect(() => {
    store.dispatch(loadDeviceReferral()).catch(err => console.warn(err))
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
      </LoginUiProvider>
    </Provider>
  )
}
