//@flow
import {connect} from 'react-redux'
import LinkedComponent
  from '../../modules/UI/components/CryptoExchangeRate/CryptoExchangeRate'
// import * as actions from '../../actions/indexActions'
import strings from '../../locales/default'
export const mapStateToProps = (state: any, ownProps: any) => {
  const fromCurrencyCode = state.cryptoExchange.fromCurrencyCode
  const exchangeRate = state.cryptoExchange.exchangeRate
  const toCurrencyCode = state.cryptoExchange.toCurrencyCode
  const insufficient = state.cryptoExchange.insufficientError
  let exchangeRateString = ''
  if (fromCurrencyCode && toCurrencyCode) {
    exchangeRateString = insufficient ? strings.enUS['fragment_insufficient_funds'] : '1 '+fromCurrencyCode + ' = '+ exchangeRate +' '+ toCurrencyCode
  }
  return {
    style: ownProps.style,
    exchangeRate: exchangeRateString,
    insufficient
  }
}

/* export const mapDispatchToProps = (dispatch) => ({
  // nextScreen: () => dispatch(actions.nextScreen())
})*/

export default connect(mapStateToProps, null)(LinkedComponent)
