// @flow

import { connect } from 'react-redux'

import type { State } from '../../../../../types/reduxTypes.js'
import * as UI_SELECTORS from '../../../selectors'
import type { Props } from './WalletName.ui'
import { WalletName } from './WalletName.ui.js'

const mapStateToProps = (state: State): Props => {
  const wallet = UI_SELECTORS.getSelectedWallet(state) || {}
  return {
    name: wallet.name,
    denomination: UI_SELECTORS.getSelectedCurrencyCode(state)
  }
}

export default connect(mapStateToProps)(WalletName)
