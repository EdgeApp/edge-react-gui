import {connect} from 'react-redux'
import LinkedComponent
  from '../../modules/UI/components/CryptoExchangeRate/CryptoExchangeRate'
// import * as actions from '../../actions/indexActions'

export const mapStateToProps = (state, ownProps) => ({
  style: ownProps.style,
  exchangeRate: state.cryptoExhange.exchangeRate
})

/* export const mapDispatchToProps = (dispatch) => ({
  // nextScreen: () => dispatch(actions.nextScreen())
})*/

export default connect(mapStateToProps, null)(LinkedComponent)
