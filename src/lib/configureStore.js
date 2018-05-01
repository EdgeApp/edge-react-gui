// @flow

/* global window __DEV__ */

import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

// import createLogger from 'redux-logger'
import loginStatusChecker from './loginStatusChecker'
import rootReducer from './rootReducer'
import soundsMiddleware from './soundsMiddleware'
import errorAlert from './errorAlert'

let middleware = [errorAlert, loginStatusChecker, thunk, soundsMiddleware]
// let logger = createLogger()

if (__DEV__) {
  // middleware = [...middleware, logger]

  // Comment line below to reenable logger
  middleware = [...middleware]
} else {
  middleware = [...middleware]
}

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'ui' }) : compose

export default function configureStore (initialState: Object) {
  // $FlowFixMe
  return createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(...middleware)))
}
