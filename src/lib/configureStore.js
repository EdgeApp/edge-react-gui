// @flow

/* global window */

import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

import ENV from '../../env.json'
import loginStatusChecker from './loginStatusChecker'
import rootReducer from './rootReducer'
import soundsMiddleware from './soundsMiddleware'
import errorAlert from './errorAlert'
import perfLogger from './perfLogger.js'

const middleware = [errorAlert, loginStatusChecker, thunk, soundsMiddleware]
if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'ui' }) : compose

export default function configureStore (initialState: Object) {
  // $FlowFixMe
  return createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(...middleware)))
}
