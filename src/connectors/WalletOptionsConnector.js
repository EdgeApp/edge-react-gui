// @flow

import { connect } from 'react-redux'

import WalletOptions from '../components/common/WalletOptions'
import type { Dispatch, State } from '../types/reduxTypes.js'

const mapStateToProps = (state: State): {} => ({})
const mapDispatchToProps = (dispatch: Dispatch): {} => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletOptions)
