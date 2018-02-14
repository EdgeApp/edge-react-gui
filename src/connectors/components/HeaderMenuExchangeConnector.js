import { Actions } from 'react-native-router-flux'
// @flow
import { connect } from 'react-redux'

import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import * as CORE_SELECTORS from '../../modules/Core/selectors.js'
import { openHelpModal } from '../../modules/UI/components/HelpModal/actions'
import LinkedComponent from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui'
import * as Styles from '../../styles/indexStyles'
import THEME from '../../theme/variables/airbitz'

export const mapStateToProps = (state: any) => {
  let sourceWalletId, sourceWallet
  if (state.cryptoExchange && state.cryptoExchange.fromWallet) {
    sourceWalletId = state.cryptoExchange.fromWallet.id
    sourceWallet = CORE_SELECTORS.getWallet(state, sourceWalletId)
  } else {
    sourceWalletId = ''
    sourceWallet = null
  }

  const data = [
    {
      label: s.strings.title_change_mining_fee, // tie into,
      key: s.strings.title_change_mining_fee,
      value: {
        title: Constants.CHANGE_MINING_FEE_VALUE,
        sourceWallet
      }
    },
    {
      label: s.strings.dropdown_exchange_max_amount,
      key: s.strings.dropdown_exchange_max_amount,
      value: {
        title: Constants.EXCHANGE_MAX_AMOUNT_VALUE
      }
    },
    {
      label: s.strings.string_help,
      key: s.strings.string_help,
      value: {
        title: Constants.HELP_VALUE
      }
    }
  ]
  return {
    style: {
      ...Styles.MenuDropDownStyleHeader,
      icon: { ...Styles.MenuDropDownStyle.icon, color: THEME.COLORS.WHITE }
    },
    exchangeRate: state.cryptoExchange.exchangeRate,
    data,
    rightSide: true,
    sourceWallet
  }
}

export const mapDispatchToProps = (dispatch: any) => ({
  onSelect: (value: Object) => {
    switch (value.title) {
      case Constants.HELP_VALUE:
        dispatch(openHelpModal())
        break
      case Constants.EXCHANGE_MAX_AMOUNT_VALUE:
        dispatch(actions.exchangeMax())
        break
      case Constants.CHANGE_MINING_FEE_VALUE:
        Actions[Constants.CHANGE_MINING_FEE_EXCHANGE]({ sourceWallet: value.sourceWallet })
        break
    }
  }
  // nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)
