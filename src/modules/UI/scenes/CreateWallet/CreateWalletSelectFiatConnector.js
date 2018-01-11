// @flow

import {connect} from 'react-redux'
import {CreateWalletSelectFiatComponent} from './CreateWalletSelectFiat.ui'
import type {State, Dispatch} from '../../../ReduxTypes'
import * as UTILS from '../../../utils'
import type { GuiFiatType, DeviceDimensions } from '../../../../types'

export type StateProps = {
  dimensions: DeviceDimensions,
  supportedFiats: Array<GuiFiatType>
}

export type OwnProps = {
  walletName: string,
  selectedWalletType: string
}

const mapStateToProps = (state: State): StateProps => ({
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})

export const CreateWalletSelectFiat = connect(mapStateToProps)(CreateWalletSelectFiatComponent)
