// @flow

import {connect} from 'react-redux'

import type {Dispatch, State} from '../../../ReduxTypes'
import {updateDailySpendingLimit, updateTransactionSpendingLimit} from './action.js'
import {checkCurrentPassword} from '../../scenes/Settings/action'
import SpendingLimits from './SpendingLimits.ui.js'

import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

export const mapStateToProps = (state: State, ownProps: Object) => ({
  pluginName:               ownProps.pluginName,
  currencyCode:             ownProps.currencyCode,
  isAuthorized:             SETTINGS_SELECTORS.getIsAuthorized(state),
  transactionSpendingLimit: SETTINGS_SELECTORS.getTransactionSpendingLimit(state, ownProps.currencyCode) || {isEnabled: true, nativeAmount: '0'}, // TODO: Remove when settings are safe -- KS
  dailySpendingLimit:       SETTINGS_SELECTORS.getDailySpendingLimit(state, ownProps.currencyCode) || {isEnabled: true, nativeAmount: '0'}, // TODO: Remove when settings are safe -- KS
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateDailySpendingLimit: (currencyCode: string, isEnabled: boolean, dailySpendingLimit: string) => {
    dispatch(updateDailySpendingLimit(currencyCode, isEnabled, dailySpendingLimit))
  },
  updateTransactionSpendingLimit: (currencyCode: string, isEnabled: boolean, dailySpendingLimit: string) => {
    dispatch(updateTransactionSpendingLimit(currencyCode, isEnabled,  dailySpendingLimit))
  },
  authorizeWithPassword: (password: string) => {
    dispatch(checkCurrentPassword(password))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(SpendingLimits)
