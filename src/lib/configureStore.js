/* eslint-disable global-require */
/* eslint-disable no-undef */
import { createStore, applyMiddleware } from 'redux'
import rootReducer from './rootReducer'
import thunk from 'redux-thunk'
import createLogger from 'redux-logger'

let middleware = [thunk]
let logger = createLogger()

if (__DEV__) {
  middleware = [...middleware, logger]
} else {
  middleware = [...middleware]
}

export default function configureStore (initialState) {
  return createStore(
    rootReducer,
    initialState,
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(
      applyMiddleware(...middleware)
    )
  )
}
