// @flow

import {connect} from 'react-redux'

import type {State} from '../../../ReduxTypes'
import SpendingLimits from './SpendingLimits.ui.js'

export const mapStateToProps = (state: State, ownProps: Object) => ({
  pluginName: ownProps.pluginName
})
export const mapDispatchToProps = () => ({})

export default connect(mapStateToProps, mapDispatchToProps)(SpendingLimits)
