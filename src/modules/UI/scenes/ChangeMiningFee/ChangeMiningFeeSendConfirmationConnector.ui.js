// @flow

import {connect} from 'react-redux'

import type {State} from '../../../ReduxTypes'
import ChangeMiningFee from './ChangeMiningFee.ui'
import { changeFee } from '../../../../modules/UI/scenes/SendConfirmation/action'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as SELECTORS from '../../selectors.js'

export const mapStateToProps = (state: State) => {
  const guiWallet = SELECTORS.getSelectedWallet(state)
  const currencyCode = guiWallet.currencyCode
  const currencyInfo = SETTINGS_SELECTORS.getCurrencyInfo(state, currencyCode)
  return {
    // fee: state.ui.scenes.sendConfirmation.fee,
    feeSetting: state.ui.scenes.sendConfirmation.feeSetting,
    customFeeSettings: SETTINGS_SELECTORS.getCustomFeeSettings(state)
  }
}

export const mapDispatchToProps = ({
  onSubmit: changeFee
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangeMiningFee)
