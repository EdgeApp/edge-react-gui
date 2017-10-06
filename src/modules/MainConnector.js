// @flow
import type {State, Dispatch} from './ReduxTypes'

import {connect} from 'react-redux'
import Main from './Main.ui'

import {addExchangeTimer} from  './UI/Settings/action'
import {setDeviceDimensions, setKeyboardHeight} from './UI/dimensions/action'
import {addContext} from './Core/Context/action.js'
import {addCurrencyPlugin} from './UI/Settings/action.js'
import {addUsernames} from './Core/Context/action'
import {setLocaleInfo} from './UI/locale/action'

import makeContextCallbacks from './Core/Context/callbacks'

const mapStateToProps = (state: State) => ({routes: state.routes})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  addExchangeTimer: () => dispatch(addExchangeTimer()),
  addCurrencyPlugin: (plugin) => dispatch(addCurrencyPlugin(plugin)),
  setKeyboardHeight: (keyboardHeight) => dispatch(setKeyboardHeight(keyboardHeight)),
  addContext: (context) => dispatch(addContext(context)),
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  setLocaleInfo: (localeInfo) => dispatch(setLocaleInfo(localeInfo)),
  setDeviceDimensions: (dimensions) => dispatch(setDeviceDimensions(dimensions)),
  contextCallbacks: makeContextCallbacks(dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
