// @flow
import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
import * as WalletActions from '../../Wallets/action'
import {WALLET_LIST_SCENE} from '../../../../constants/SceneKeys.js'
import {displayErrorAlert} from '../../components/ErrorAlert/actions'

export const UPDATE_WALLET_NAME = 'UPDATE_WALLET_NAME'
export const SELECT_WALLET_TYPE = 'SELECT_WALLET_TYPE'
export const SELECT_FIAT = 'SELECT_FIAT'
export const CREATE_WALLET_START = 'CREATE_WALLET_START'
export const CREATE_WALLET_SUCCESS = 'CREATE_WALLET_SUCCESS'
export const CREATE_WALLET_FAILURE = 'CREATE_WALLET_FAILURE'

export const updateWalletName = (walletName: string) => ({
  type: UPDATE_WALLET_NAME,
  data: {walletName}
})

export const selectWalletType = (walletType: string) => ({
  type: SELECT_WALLET_TYPE,
  data: {walletType}
})

export const selectFiat = (fiat: string) => ({
  type: SELECT_FIAT,
  data: {fiat}
})

export const createCurrencyWallet = (
  walletName: string,
  walletType: string,
  fiatCurrencyCode: string,
  popScene: boolean = true,
  selectWallet: boolean = false
) => (dispatch: any, getState: any) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  dispatch(createWalletStart())
  return ACCOUNT_API.createCurrencyWalletRequest(account, walletType, {
    name: walletName,
    fiatCurrencyCode
  }).then((abcWallet) => {
    Actions.popTo(WALLET_LIST_SCENE)
    dispatch(createWalletSuccess())
    if (selectWallet) {
      dispatch(WalletActions.selectWallet(abcWallet.id, abcWallet.currencyInfo.currencyCode))
    }
  })
  .catch((e) => {
    dispatch(displayErrorAlert(e.message))
  })
}

export const createWalletStart = () => ({
  type: CREATE_WALLET_START
})

export const createWalletSuccess = () => ({
  type: CREATE_WALLET_SUCCESS
})

export const createWalletFailure = () => ({
  type: CREATE_WALLET_FAILURE
})
