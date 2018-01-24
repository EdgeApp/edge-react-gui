// @flow

import { connect } from 'react-redux'

import type { Dispatch } from '../../../../ReduxTypes'

import HelpButton from './HelpButton.ui'
import { openHelpModal } from '../../HelpModal/actions'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  openHelpModal: () => dispatch(openHelpModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(HelpButton)
