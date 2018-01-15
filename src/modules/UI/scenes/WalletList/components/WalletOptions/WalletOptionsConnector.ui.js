// @flow
import {connect} from 'react-redux'
import WalletOptions from './WalletOptions.ui'

import {
  CLOSE_MODAL_VALUE,
  VISIBLE_MODAL_NAME,
  CLOSE_MODAL_FUNCTION
} from './action'

import * as Constants from '../../../../../../constants/indexConstants.js'

const mapStateToProps = (state: any): {} => {
  const props = {}

  for (const walletOption in Constants.WALLET_OPTIONS) {
    const option = Constants.WALLET_OPTIONS[walletOption]
    if (option.modalVisible) {
      const propName = VISIBLE_MODAL_NAME(option.value)
      if (typeof state.ui.scenes.walletList[propName] === 'boolean') {
        props[propName] = state.ui.scenes.walletList[propName]
      }
    }
  }

  return props
}

const mapDispatchToProps = (dispatch: Function): {} => {
  const props = {}

  for (const walletOption in Constants.WALLET_OPTIONS) {
    const option = Constants.WALLET_OPTIONS[walletOption]
    if (option.modalVisible) {
      const value = option.value
      props[CLOSE_MODAL_FUNCTION(value)] = () => dispatch({ type: CLOSE_MODAL_VALUE(value) })
    }
  }

  return props
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletOptions)
