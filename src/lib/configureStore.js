// @flow

/* global window */

import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

import ENV from '../../env.json'
import errorAlert from './errorAlert'
import loginStatusChecker from './loginStatusChecker'
import perfLogger from './perfLogger.js'
import rootReducer from './rootReducer'
import soundsMiddleware from './soundsMiddleware'

const middleware = [errorAlert, loginStatusChecker, thunk, soundsMiddleware]
if (ENV.ENABLE_REDUX_PERF_LOGGING) middleware.push(perfLogger)

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'ui', maxAge: 50 }) : compose

export default function configureStore (initialState: Object) {
  // $FlowFixMe
  return createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(...middleware)))
}
