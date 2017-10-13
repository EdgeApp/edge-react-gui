//@flow
import {connect} from 'react-redux'
import LinkedComponent
  from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui'
import * as Styles from '../../styles/indexStyles'
import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import strings from '../../locales/default'
import THEME from '../../theme/variables/airbitz'


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
    data
  }
}

export const mapDispatchToProps = (dispatch: any) => ({
  openMenu: () => dispatch(actions.dispatchAction(Constants.OPEN_EXCHANGE_HEADER_MENU)),
  closeMenu: () => dispatch(actions.dispatchAction(Constants.CLOSE_EXCHANGE_HEADER_MENU)),
  onSelect: (value: string) => {
    console.log(value)
  }
  //nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)
