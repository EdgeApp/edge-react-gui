import {connect} from 'react-redux'
import {TextAndIconButton} from '../../../components/Buttons/TextAndIconButton.ui'
import * as UI_SELECTORS from '../../../selectors'
import {
  toggleSelectedWalletListModal,
  toggleScanToWalletListModal
} from '../../WalletListModal/action'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'
import * as Constants from '../../../../../constants/indexConstants'
import * as Styles from '../../../../../styles/indexStyles'
const mapStateToProps = (state) => {

  const selectedWallet = UI_SELECTORS.getSelectedWallet(state)
  const selectedWalletCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const LOADING_TEXT = sprintf(strings.enUS['loading'])
  const title = selectedWallet
  ? selectedWallet.name + ':' + selectedWalletCurrencyCode
  : LOADING_TEXT
  return {
    title,
    style: {...Styles.TextAndIconButtonStyle,
      content:  {...Styles.TextAndIconButtonStyle.content, position: 'relative', width:'80%'},
      centeredContent: {...Styles.TextAndIconButtonStyle.centeredContent, position: 'relative', width:'80%'}},
    icon: Constants.KEYBOARD_ARROW_DOWN,
    iconType: Constants.MATERIAL_ICONS
  }
}
const mapDispatchToProps = (dispatch) => ({
  onPress: () => {
    dispatch(toggleSelectedWalletListModal())
    dispatch(toggleScanToWalletListModal())
    /* toggleSelectedWalletListModal: () => dispatch(toggleSelectedWalletListModal())
    toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()) */
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(TextAndIconButton)
