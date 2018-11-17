// @flow

import { connect } from 'react-redux'

import WalletOptions from '../components/common/WalletOptions'
import type { Dispatch, State } from '../modules/ReduxTypes'

const mapStateToProps = (state: State): {} => ({})
const mapDispatchToProps = (dispatch: Dispatch): {} => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletOptions)
