// @flow

import {connect} from 'react-redux'

import type {State} from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { changeFee } from '../../../../modules/UI/scenes/SendConfirmation/action'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as SELECTORS from '../../selectors.js'

export const mapStateToProps = (state: State) => {
  const { currencyCode } = SELECTORS.getSelectedWallet(state)
  return {
    // fee: state.ui.scenes.sendConfirmation.fee,
    customFeeSettings: SETTINGS_SELECTORS.getCustomFeeSettings(state, currencyCode),
    feeSetting: state.ui.scenes.sendConfirmation.feeSetting
  }
}

export const mapDispatchToProps = ({
  onSubmit: changeFee
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
