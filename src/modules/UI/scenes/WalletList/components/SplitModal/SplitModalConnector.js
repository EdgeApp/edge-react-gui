// @flow

import {connect} from 'react-redux'

import SplitModal from './SplitModal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import type {Dispatch, State} from '../../../../../ReduxTypes'
import { VISIBLE_MODAL_NAME, CLOSE_MODAL_VALUE } from '../WalletOptions/action'

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList[VISIBLE_MODAL_NAME(Constants.SPLIT_VALUE)]
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.SPLIT_VALUE) })
})

export default connect(mapStateToProps, mapDispatchToProps)(SplitModal)
