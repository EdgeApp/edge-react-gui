import {combineReducers} from 'redux'
import * as ACTION from './action'

const loadingScreenVisible = ( state = false, action) => {
  switch(action.type){
    case ACTION.ENABLE_LOADING_SCREEN_VISIBILITY:
      return true
    case ACTION.DISABLE_LOADING_SCREEN_VISIBILITY : 
        return false
    default:
      return state
  }
}

const container = combineReducers({
  loadingScreenVisible
})

export default container