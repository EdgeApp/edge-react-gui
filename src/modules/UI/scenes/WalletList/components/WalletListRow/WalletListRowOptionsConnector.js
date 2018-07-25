// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes.js'
import * as CORE_SELECTORS from '../../../../../Core/selectors'

import WalletListRowOptions from './WalletListRowOptions.ui'

const mapStateToProps = (state: State, ownProps) => {
  const account = CORE_SELECTORS.getAccount(state)
  return { account }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListRowOptions)
