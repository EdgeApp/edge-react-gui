// @flow

import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'

import DefaultFiatSetting from './DefaultFiatSetting.ui'
import {getDefaultFiat} from '../../Settings/selectors'
import {setDefaultFiatRequest} from './action'
import {getSupportedFiats} from '../../../utils'

import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  defaultFiat: getDefaultFiat(state),
  supportedFiats: getSupportedFiats()
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSelectFiat: (selectedDefaultFiat) => {
    dispatch(setDefaultFiatRequest(selectedDefaultFiat))
    Actions.pop()
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(DefaultFiatSetting)
