import {combineReducers} from 'redux'
import * as ACTION from './action'

const headerHeight = ( state = 0, action) => {
  switch(action.type){
    case ACTION.SET_HEADER_HEIGHT:
      return action.data
    default:
      return state
  }
}

const dimensions = combineReducers({
  headerHeight
})

export default dimensions