// @flow

import { connect } from 'react-redux'

import type { Dispatch } from '../../../../../types/reduxTypes.js'
import { openHelpModal } from '../../HelpModal/actions'
import HelpButton from './HelpButton.ui'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  openHelpModal: () => dispatch(openHelpModal())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HelpButton)
