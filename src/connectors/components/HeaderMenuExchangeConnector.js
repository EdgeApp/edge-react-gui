//@flow
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import LinkedComponent
  from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui'
import * as Styles from '../../styles/indexStyles'
import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import strings from '../../locales/default'
import THEME from '../../theme/variables/airbitz'
import {openHelpModal} from '../../modules/UI/components/HelpModal/actions'

export const mapStateToProps = (state: any) => {
  const data =[
    {
      label : strings.enUS['change_mining_fee_title'], // tie into
      value: Constants.CHANGE_MINING_FEE_VALUE
    },
    {
      label : strings.enUS['dropdown_exchange_max_amount'],
      value: Constants.EXCHANGE_MAX_AMOUNT_VALUE
    },
    {
      label : strings.enUS['string_help'],
      value: Constants.HELP_VALUE
    }
  ]
  return {
    style: {...Styles.MenuDropDownStyle, icon: {...Styles.MenuDropDownStyle.icon, color:THEME.COLORS.WHITE} },
    exchangeRate: state.cryptoExchange.exchangeRate,
    data,
    rightSide: true
  }
}

export const mapDispatchToProps = (dispatch: any) => ({
  onSelect: (value: string) => {
    console.log(value)
    switch (value) {
    case Constants.HELP_VALUE:
      console.log('HELP MENU CLICK ')
      dispatch(openHelpModal())
      break
    case Constants.EXCHANGE_MAX_AMOUNT_VALUE:
      console.log('EXCHANGE_MAX_AMOUNT_VALUE MENU CLICK ')
      dispatch(actions.exchangeMax())
      break
    case Constants.CHANGE_MINING_FEE_VALUE:
      console.log('EXCHANGE_MAX_AMOUNT_VALUE MENU CLICK ')
      Actions[Constants.CHANGE_MINING_FEE_EXCHANGE]()
      break
    }
  }
  //nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)
