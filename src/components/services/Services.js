// @flow
/* global window */

import { type DiskletFolder, makeReactNativeFolder } from 'disklet'
import { type EdgeContext } from 'edge-core-js/types'
import React, { PureComponent } from 'react'
import DeviceInfo from 'react-native-device-info'
import Locale from 'react-native-locale'
import { MenuProvider } from 'react-native-popup-menu'
import { Provider } from 'react-redux'
import { type Store, applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

import ENV from '../../../env.json'
import Main from '../../connectors/MainConnector.js'
import { setIntlLocale } from '../../locales/intl.js'
import { selectLocale } from '../../locales/strings.js'
import { rootReducer } from '../../reducers/RootReducer.js'
import { type Action } from '../../types/reduxActions.js'
import { type State } from '../../types/reduxTypes.js'
import errorAlert from '../../util/errorAlert.js'
import loginStatusChecker from '../../util/loginStatusChecker.js'
import perfLogger from '../../util/perfLogger.js'
import { ModalProvider } from '../common/ModalProvider.js'
import { Airship } from './AirshipInstance.js'
import { AutoLogout } from './AutoLogout.js'
import { ContactsLoader } from './ContactsLoader.js'
import EdgeAccountCallbackManager from './EdgeAccountCallbackManager.js'
import EdgeContextCallbackManager from './EdgeContextCallbackManager.js'
import EdgeWalletsCallbackManager from './EdgeWalletsCallbackManager.js'

type Props = { context: EdgeContext }

/**
 * Provides various global services to the application,
 * including the Redux store, pop-up menus, modals, etc.
 */
export class Services extends PureComponent<Props> {
  store: Store<State, Action>

  constructor (props: Props) {
    super(props)

    const middleware: Array<Object> = [errorAlert, loginStatusChecker, thunk]
    if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

    const composeEnhancers =
      typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && ENV.ENABLE_REDUX_DEBUG
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'ui', maxAge: 50 })
        : compose

    const initialState: Object = {}
    this.store = createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(...middleware)))

    // Put the context into Redux:
    const { context } = props
    const folder = makeReactNativeFolder()
    this.store.dispatch({
      type: 'CORE/CONTEXT/ADD_CONTEXT',
      data: { context, folder }
    })

    context.listUsernames().then(usernames => {
      this.store.dispatch({
        type: 'CORE/CONTEXT/ADD_USERNAMES',
        data: { usernames }
      })
      queryUtilServer(context, folder, usernames)
    })
  }

  componentDidMount () {
    setIntlLocale(Locale.constants())
    selectLocale(DeviceInfo.getDeviceLocale())
  }

  renderGui () {
    return (
      <MenuProvider>
        <Main />
      </MenuProvider>
    )
  }

  render () {
    return (
      <Provider store={this.store}>
        <React.Fragment>
          {this.renderGui()}
          <Airship />
          <AutoLogout />
          <ContactsLoader />
          <EdgeAccountCallbackManager />
          <EdgeContextCallbackManager />
          <EdgeWalletsCallbackManager />
          <ModalProvider />
        </React.Fragment>
      </Provider>
    )
  }
}

const UTILITY_SERVER_FILE = 'utilityServer.json'

async function queryUtilServer (context: EdgeContext, folder: DiskletFolder, usernames: Array<string>) {
  let jsonObj: null | Object = null
  try {
    const json = await folder.file(UTILITY_SERVER_FILE).getText()
    jsonObj = JSON.parse(json)
    if (jsonObj.currencyCode) {
      global.currencyCode = jsonObj.currencyCode
    }
    return
  } catch (e) {
    // Failing here is OK, fall through:
  }

  try {
    if (usernames.length === 0) {
      // New app launch. Query the utility server for referral information
      const response = await fetch('https://util1.edge.app/ref')
      if (response) {
        const util = await response.json()
        if (util.currencyCode) {
          global.currencyCode = util.currencyCode
        }
        // Save util data
        folder.file(UTILITY_SERVER_FILE).setText(JSON.stringify(util))
      }
    }
  } catch (e) {
    // Failing here is still OK, but log it:
    console.log(e)
  }
}
