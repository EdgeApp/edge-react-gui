// @flow

import { Animated } from 'react-native'
import { connect } from 'react-redux'

import type { DispatchProps, StateProps } from '../../components/scenes/FioRequestListScene'
import { FioRequestList } from '../../components/scenes/FioRequestListScene'
import { isConnectedState } from '../../modules/Core/selectors'
import { updateExchangeRates } from '../../modules/ExchangeRates/action.js'
import { getFioRequestsPending, getFioRequestsSent, rejectRequest } from '../../modules/FioRequest/action'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import { getSelectedCurrencyCode, getSelectedWallet, getWallets } from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes'
import { getFiatSymbol } from '../../util/utils'

const mapStateToProps = (state: State) => {
  const wallets = getWallets(state)
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    return {
      loading: true
    }
  }
  const fiatSymbol = getFiatSymbol(getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode

  const { fioRequestsPending, fioRequestsSent, pendingRequestsLoading, sentRequestsLoading } = state.ui.scenes.fioRequest
  const exchangeRates = state.exchangeRates
  const animation = new Animated.Value(0)

  const displayDenominations = {}
  for (const pRequest of fioRequestsPending) {
    const {
      content: { token_code }
    } = pRequest
    if (!displayDenominations[token_code]) {
      displayDenominations[token_code] = getDisplayDenomination(state, token_code)
    }
  }
  for (const sRequest of fioRequestsSent) {
    const {
      content: { token_code }
    } = sRequest
    if (!displayDenominations[token_code]) {
      displayDenominations[token_code] = getDisplayDenomination(state, token_code)
    }
  }

  const out: StateProps = {
    loading: pendingRequestsLoading || sentRequestsLoading,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    fiatSymbol,
    displayDenominations,
    fioRequestsPending,
    fioRequestsSent: fioRequestsSent.sort((a, b) => (a.time_stamp > b.time_stamp ? -1 : 1)),
    exchangeRates,
    animation,
    wallets,
    isConnected: isConnectedState(state)
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getFioRequestsPending: () => dispatch(getFioRequestsPending()),
  getFioRequestsSent: () => dispatch(getFioRequestsSent()),
  fioRejectRequest: (fioRequestId: string, payerFioAddress: string, cb: Function) => {
    dispatch(rejectRequest(fioRequestId, payerFioAddress, cb))
  },
  removeFioPendingRequest: (requestId: string) => dispatch({ type: 'FIO/FIO_REQUEST_LIST_REMOVE', data: { requestId } }),
  updateExchangeRates: () => dispatch(updateExchangeRates())
})

export const FioRequestListConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioRequestList)
