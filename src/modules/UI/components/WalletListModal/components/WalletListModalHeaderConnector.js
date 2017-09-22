// @flow
import {connect} from 'react-redux'
import WalletListModalHeader from './WalletListModalHeader.ui'
import {disableWalletListModalVisibility} from '../action'

const mapStateToProps = (): {} => ({})
const mapDispatchToProps = (dispatch: Function): {} => ({
  disableWalletListModalVisibility: () => dispatch(disableWalletListModalVisibility())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListModalHeader)
