// @flow

import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'

import DefaultFiatSetting from './DefaultFiatSetting.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import {setDefaultFiatRequest} from './action'
import * as UTILS from '../../../utils'

import type {State, Dispatch} from '../../../ReduxTypes.js'

const mapStateToProps = (state: State) => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSelectFiat: (selectedDefaultFiat) => {
    dispatch(setDefaultFiatRequest(selectedDefaultFiat))
    Actions.pop()
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(DefaultFiatSetting)
