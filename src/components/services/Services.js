// @flow
/* global window */

import { makeReactNativeDisklet } from 'disklet'
import { type EdgeContext } from 'edge-core-js/types'
import * as React from 'react'
import { AppearanceProvider } from 'react-native-appearance'
import { MenuProvider } from 'react-native-popup-menu'
import { Provider } from 'react-redux'
import { type Store, applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

import ENV from '../../../env.json'
import { loadDeviceReferral } from '../../actions/DeviceReferralActions.js'
import { rootReducer } from '../../reducers/RootReducer.js'
import { type Action } from '../../types/reduxActions.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import errorAlert from '../../util/errorAlert.js'
import loginStatusChecker from '../../util/loginStatusChecker.js'
import perfLogger from '../../util/perfLogger.js'
import { ModalProvider } from '../common/ModalProvider.js'
import { Main } from '../Main.ui.js'
import { Airship } from './AirshipInstance.js'
import { AutoLogout } from './AutoLogout.js'
import { ContactsLoader } from './ContactsLoader.js'
import { DeepLinkingManager } from './DeepLinkingManager.js'
import EdgeAccountCallbackManager from './EdgeAccountCallbackManager.js'
import EdgeContextCallbackManager from './EdgeContextCallbackManager.js'
import EdgeWalletsCallbackManager from './EdgeWalletsCallbackManager.js'
import { PermissionsManager } from './PermissionsManager.js'

type Props = { context: EdgeContext }

/**
 * Provides various global services to the application,
 * including the Redux store, pop-up menus, modals, etc.
 */
export class Services extends React.PureComponent<Props> {
  store: Store<RootState, Action>
  dispatch: Dispatch

  constructor(props: Props) {
    super(props)

    const middleware: Object[] = [errorAlert, loginStatusChecker, thunk]
    if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

    const composeEnhancers =
      typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && ENV.ENABLE_REDUX_DEBUG
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'ui', maxAge: 50 })
        : compose

    const initialState: Object = {}
    this.store = createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(...middleware)))
    const flowHack: any = this.store.dispatch
    this.dispatch = flowHack // Flow doesn't know about redux-thunk

    // Put the context into Redux:
    const { context } = props
    const disklet = makeReactNativeDisklet()
    this.store.dispatch({
      type: 'CORE/CONTEXT/ADD_CONTEXT',
      data: { context, disklet }
    })
  }

  componentDidMount() {
    this.dispatch(loadDeviceReferral())
  }

  renderGui() {
    return (
      <AppearanceProvider>
        <MenuProvider>
          <Main />
        </MenuProvider>
      </AppearanceProvider>
    )
  }

  render() {
    return (
      <Provider store={this.store}>
        <>
          {this.renderGui()}
          <Airship avoidAndroidKeyboard statusBarTranslucent />
          <AutoLogout />
          <ContactsLoader />
          <DeepLinkingManager />
          <EdgeAccountCallbackManager />
          <EdgeContextCallbackManager />
          <EdgeWalletsCallbackManager />
          <ModalProvider />
          <PermissionsManager />
        </>
      </Provider>
    )
  }
}
