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

export default (data = {}) => {

	return createStore(rootReducer, data, enhancer)

} 
