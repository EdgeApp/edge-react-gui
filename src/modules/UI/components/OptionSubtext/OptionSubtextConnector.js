// @flow

import { connect } from 'react-redux'

import type { State } from '../../../../types/reduxTypes.js'
import { getWalletName } from '../../../Core/selectors'
import OptionSubtext from './OptionSubtext.ui'

const mapStateToProps = (state: State, ownProps: { label: string, confirmationText: string }) => ({
  confirmationText: ownProps.confirmationText,
  label: ownProps.label,
  walletName: getWalletName(state, state.ui.scenes.walletList.walletId)
})
const mapDispatchToProps = () => ({})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OptionSubtext)
