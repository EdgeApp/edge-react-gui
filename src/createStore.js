import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import thunk from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from './rootReducer'

const logger = createLogger({ predicate: (getState, action) => __DEV__  })
const enhancer = compose(
	applyMiddleware(
		thunk, 
		logger
	)
)

const store = (data = {}) => createStore(rootReducer, data, enhancer)

export default store()
