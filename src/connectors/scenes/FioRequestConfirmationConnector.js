// @flow

import { connect } from 'react-redux'

import { refreshReceiveAddressRequest, selectWalletFromModal } from '../../actions/WalletActions'
import type { FioRequestConfirmationDispatchProps, FioRequestConfirmationProps } from '../../components/scenes/FioRequestConfirmationScene'
import { FioRequestConfirmationComponent } from '../../components/scenes/FioRequestConfirmationScene'
import * as CORE_SELECTORS from '../../modules/Core/selectors.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../types/types'
import { emptyCurrencyInfo } from '../../types/types'
import { getDenomFromIsoCode } from '../../util/utils'

const mapStateToProps = (state: State): FioRequestConfirmationProps => {
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const account = CORE_SELECTORS.getAccount(state)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  const allWallets: any = UI_SELECTORS.getWallets(state)
  const { amounts, fioModalData } = state.ui.scenes.fioRequest
  const isConnected = CORE_SELECTORS.isConnectedState(state)

  if (!guiWallet || !currencyCode) {
    return {
      exchangeSecondaryToPrimaryRatio: 0,
      loading: true,
      chainCode: '',
      primaryCurrencyInfo: emptyCurrencyInfo,
      secondaryCurrencyInfo: emptyCurrencyInfo,
      publicAddress: '',
      amounts,
      fioModalData,
      allWallets,
      account,
      isConnected
    }
  }

  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
  const primaryExchangeCurrencyCode: string = primaryExchangeDenomination.name
  const secondaryExchangeCurrencyCode: string = secondaryExchangeDenomination.name ? secondaryExchangeDenomination.name : ''

  const primaryCurrencyInfo: GuiCurrencyInfo = {
    displayCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeCurrencyCode: primaryExchangeCurrencyCode,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryCurrencyInfo: GuiCurrencyInfo = {
    displayCurrencyCode: guiWallet.fiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeCurrencyCode: secondaryExchangeCurrencyCode,
    exchangeDenomination: secondaryExchangeDenomination
  }
  const isoFiatCurrencyCode: string = guiWallet.isoFiatCurrencyCode
  const exchangeSecondaryToPrimaryRatio = UI_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

  return {
    exchangeSecondaryToPrimaryRatio,
    publicAddress: guiWallet.receiveAddress.publicAddress || '',
    loading: false,
    chainCode: guiWallet.currencyCode,
    primaryCurrencyInfo,
    secondaryCurrencyInfo,
    amounts,
    fioModalData,
    allWallets,
    account,
    isConnected
  }
}
const mapDispatchToProps = (dispatch: Dispatch): FioRequestConfirmationDispatchProps => ({
  refreshReceiveAddressRequest: (walletId: string) => {
    dispatch(refreshReceiveAddressRequest(walletId))
  },
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch(selectWalletFromModal(walletId, currencyCode))
  }
})

export const FioRequestConfirmationConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioRequestConfirmationComponent)
