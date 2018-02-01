// @flow

import {connect} from 'react-redux'

import WalletOptions from './WalletOptions.ui'
import type {Dispatch, State} from '../../../../../ReduxTypes'

const mapStateToProps = (state: State): {} => ({})
const mapDispatchToProps = (dispatch: Dispatch): {} => ({})

export default connect(mapStateToProps, mapDispatchToProps)(WalletOptions)
