// @flow
import {connect} from 'react-redux'
import WalletListModalHeader from './WalletListModalHeader.ui'
import {disableWalletListModalVisibility} from '../action'
import * as Constants from '../../../../../constants/indexConstants'

const mapStateToProps = (state?: any, ownProps: any): {type: string, whichWallet: string} => {
  // console.log(state.ui.scenes.dimensions)
  const walletType = ownProps.type ? ownProps.type : Constants.FROM
  return {
    type: walletType,
    whichWallet: ownProps.whichWallet
  }

}
const mapDispatchToProps = (dispatch: Function): {} => ({
  disableWalletListModalVisibility: () => dispatch(disableWalletListModalVisibility())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListModalHeader)
