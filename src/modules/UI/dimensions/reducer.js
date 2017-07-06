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

const tabBarHeight = ( state = 0, action) => {
  switch(action.type){
    case ACTION.SET_TAB_BAR_HEIGHT:
      return action.data
    default:
      return state
  }
}

const deviceDimensions = (state = {}, action) => {
  switch(action.type) {
    case ACTION.SET_DEVICE_DIMENSIONS:
      return action.data
    default:
      return state
  }
}

const dimensions = combineReducers({
  headerHeight,
  tabBarHeight,
  deviceDimensions
})

export default dimensions