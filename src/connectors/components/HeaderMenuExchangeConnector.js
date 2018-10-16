// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { exchangeMax } from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import { openHelpModal } from '../../modules/UI/components/HelpModal/actions'
import { type DispatchProps, MenuDropDown, type StateProps } from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui.js'
import * as Styles from '../../styles/indexStyles'
import THEME from '../../theme/variables/airbitz'

export const dropDownStyle = {
  ...Styles.MenuDropDownStyleHeader,
  icon: { ...Styles.MenuDropDownStyle.icon, color: THEME.COLORS.WHITE }
}
export const mapStateToProps = (state: State): StateProps => {
  const data = [
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
    style: dropDownStyle,
    data
  }
}

export const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onSelect: (value: Object) => {
    switch (value.title) {
      case Constants.HELP_VALUE:
        dispatch(openHelpModal())
        break
      case Constants.EXCHANGE_MAX_AMOUNT_VALUE:
        dispatch(exchangeMax())
        break
      case Constants.CHANGE_MINING_FEE_VALUE:
        Actions[Constants.CHANGE_MINING_FEE_EXCHANGE]({ sourceWallet: value.sourceWallet })
        break
    }
  }
  // nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MenuDropDown)
