// @flow
/* global window __DEV__ */
import {createStore, applyMiddleware, compose} from 'redux'

import rootReducer from './rootReducer'
import thunk from 'redux-thunk'
// import createLogger from 'redux-logger'
import loginStatusChecker from './loginStatusChecker'
import soundsMiddleware from './soundsMiddleware'

let middleware = [loginStatusChecker, thunk, soundsMiddleware]
// let logger = createLogger()

if (__DEV__) {
  // middleware = [...middleware, logger]

  // Comment line below to reenable logger
  middleware = [...middleware]
} else {
  middleware = [...middleware]
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export default function configureStore (initialState: Object) {
  return createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middleware))
  )
}
