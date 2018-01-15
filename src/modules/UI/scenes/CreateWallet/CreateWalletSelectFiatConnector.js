// @flow

import {connect} from 'react-redux'
// eslint-disable-next-line no-duplicate-imports
import {
  CreateWalletSelectFiatComponent
} from './CreateWalletSelectFiat.ui'
// eslint-disable-next-line no-duplicate-imports
import type {
  CreateWalletSelectFiatStateProps
} from './CreateWalletSelectFiat.ui'

import type {State, Dispatch} from '../../../ReduxTypes'
import * as UTILS from '../../../utils'
import type { GuiFiatType, DeviceDimensions } from '../../../../types'

const mapStateToProps = (state: State): CreateWalletSelectFiatStateProps => ({
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})

export const CreateWalletSelectFiat = connect(mapStateToProps)(CreateWalletSelectFiatComponent)
