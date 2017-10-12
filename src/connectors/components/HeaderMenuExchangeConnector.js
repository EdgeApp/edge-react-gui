import {connect} from 'react-redux'
import LinkedComponent
  from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui'
import * as Styles from '../../styles/indexStyles'
import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'

export const mapStateToProps = (state) => {
  const data =[
    {
      label : 'blue ',
      value: 'oh yeah'
    },
    {
      label : 'Bob',
      value: 'mo Bob'
    },
    {
      label : 'REd',
      value: 'greem'
    }
  ]
  return {
    style: Styles.MenuDropDownStyle,
    exchangeRate: state.cryptoExhange.exchangeRate,
    data
  }
}

export const mapDispatchToProps = (dispatch) => ({
  openMenu: () => dispatch(actions.dispatchAction(Constants.OPEN_EXCHANGE_HEADER_MENU)),
  closeMenu: () => dispatch(actions.dispatchAction(Constants.CLOSE_EXCHANGE_HEADER_MENU)),
  onSelect: (value) => {
    console.log(value)
  }
  //nextScreen: () => dispatch(actions.nextScreen())
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)
