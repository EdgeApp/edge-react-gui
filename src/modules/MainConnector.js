// @flow
import type {Dispatch} from './ReduxTypes'

import {connect} from 'react-redux'
import Main from './Main.ui'

import {addExchangeTimer} from  './UI/Settings/action'
import {setKeyboardHeight} from './UI/dimensions/action'
import {addContext} from './Core/Context/action.js'
import {addCurrencyPlugin} from './UI/Settings/action.js'
import {addUsernames} from './Core/Context/action'
import {setLocaleInfo} from './UI/locale/action'
import {enableScan, disableScan} from './UI/scenes/Scan/action'

import makeContextCallbacks from './Core/Context/callbacks'

const mapStateToProps = () => ({})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatchEnableScan: () => dispatch(enableScan()),
  dispatchDisableScan: () => dispatch(disableScan()),
  addExchangeTimer: () => dispatch(addExchangeTimer()),
  addCurrencyPlugin: (plugin) => dispatch(addCurrencyPlugin(plugin)),
  setKeyboardHeight: (keyboardHeight) => dispatch(setKeyboardHeight(keyboardHeight)),
  addContext: (context) => dispatch(addContext(context)),
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  setLocaleInfo: (localeInfo) => dispatch(setLocaleInfo(localeInfo)),
  contextCallbacks: makeContextCallbacks(dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
