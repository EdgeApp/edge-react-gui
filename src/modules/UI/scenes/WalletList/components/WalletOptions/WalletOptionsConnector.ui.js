// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import WalletOptions from './WalletOptions.ui'

const mapStateToProps = (state: State): {} => ({})
const mapDispatchToProps = (dispatch: Dispatch): {} => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletOptions)
