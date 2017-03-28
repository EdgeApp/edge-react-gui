import { combineReducers } from 'redux'
import routes from './routesReducer'

import * as SideMenu from '../modules/SideMenu/SideMenu.reducer'

const store = combineReducers({

  sidemenu: combineReducers({
    view  : SideMenu.view
  }),

  routes
})

export default store
