// @flow

import { connect } from 'react-redux'

import * as Constants from '../../../../../../constants/indexConstants.js'
import type { State } from '../../../../../ReduxTypes'
import { OPEN_MODAL_VALUE, wrap } from '../../../WalletList/components/WalletOptions/action'
import CustomFees from './CustomFees.ui'

export const mapStateToProps = (state: State) => ({})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onPressed: () => dispatch(wrap(OPEN_MODAL_VALUE(Constants.CUSTOM_FEES)))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomFees)
