import {connect} from 'react-redux'
import Main from './Main.ui'

import {addExchangeTimer} from  './UI/Settings/action'
import {setDeviceDimensions, setKeyboardHeight} from './UI/dimensions/action'
import {addContext} from './Core/Context/action.js'
import {setHeaderHeight} from './UI/dimensions/action.js'
import {addCurrencyPlugin} from './UI/Settings/action.js'
import {addUsernames} from './Core/Context/action'
import {setLocaleInfo} from './UI/locale/action'

const mapStateToProps = (state) => ({routes: state.routes})
const mapDispatchToProps = (dispatch) => ({
  addExchangeTimer: () => dispatch(addExchangeTimer()),
  addCurrencyPlugin: (plugin) => dispatch(addCurrencyPlugin(plugin)),
  setKeyboardHeight: (keyboardHeight) => dispatch(setKeyboardHeight(keyboardHeight)),
  addContext: (context) => dispatch(addContext(context)),
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  setLocaleInfo: (localeInfo) => dispatch(setLocaleInfo(localeInfo)),
  setDeviceDimensions: (dimensions) => dispatch(setDeviceDimensions(dimensions)),
  setHeaderHeight: (height) => dispatch(setHeaderHeight(height))
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
