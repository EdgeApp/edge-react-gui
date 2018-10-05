// @flow

import { connect } from 'react-redux'

import type { State } from '../../../../../ReduxTypes'
import CustomFees from './CustomFees.ui'

export const mapStateToProps = (state: State) => ({})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onPressed: () => dispatch({ type: 'OPEN_CUSTOM_FEES_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomFees)
