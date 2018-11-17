// @flow

import { connect } from 'react-redux'

import CustomFees from '../components/common/CustomFees'
import type { State } from '../modules/ReduxTypes'

export const mapStateToProps = (state: State) => ({})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onPressed: () => dispatch({ type: 'OPEN_CUSTOM_FEES_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomFees)
