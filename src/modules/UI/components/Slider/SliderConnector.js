// @flow

import {connect} from 'react-redux'
import type {State, Dispatch} from '../../../ReduxTypes'

import { clearSliderError } from './action.js'
import Slider from './Slider.ui.js'

const mapStateToProps = (state: State) => ({error: state.ui.scenes.sliderError})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  clearError: () => dispatch(clearSliderError())
})

export default connect(mapStateToProps, mapDispatchToProps)(Slider)
