// @flow

import { connect } from 'react-redux'

import { getWalletName } from '../../../Core/selectors'
import type { State } from '../../../ReduxTypes'
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
