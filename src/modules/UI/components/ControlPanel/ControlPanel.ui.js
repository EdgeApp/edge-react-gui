// @flow

import * as React from 'react'

import { selectWalletFromModal } from '../../../../actions/WalletActions.js'
import { SceneWrapper } from '../../../../components/common/SceneWrapper.js'
import type { GuiExchangeRates, GuiWallet } from '../../../../types/types.js'
import { emptyGuiDenomination } from '../../../../types/types.js'
import { getCurrencyIcon } from '../../../../util/CurrencyInfoHelpers.js'
import { useDispatch, useSelector, useState } from '../../../../util/hooks'
import { getDenomFromIsoCode, getObjectDiff } from '../../../../util/utils.js'
import { logoutRequest } from '../../../Login/action'
import { getDisplayDenominationFull } from '../../../Settings/selectors.js'
import { getExchangeDenomination, getExchangeRate, getSelectedWallet } from '../../../UI/selectors.js'
import AccountList from './components/AccountList'
import PanelBody from './components/PanelBody'
import PanelHeader from './components/PanelHeader'
import UserList from './components/UserListConnector'

export type StateProps = {
  selectedCurrencyCode: string,
  selectedWalletId: string,
  username: string,
  exchangeRates: GuiExchangeRates,
  guiWallet: GuiWallet,
  exchangeRate: any,
  primaryDisplayDenomination: any,
  primaryExchangeDenomination: any
}

export default function ControlPanel() {
  const [isViewUserList, setIsViewUserList] = useState(false)

  const toggleUserList = () => setIsViewUserList(!isViewUserList)

  const dispatch = useDispatch()

  // Get props from redux state
  const { selectedCurrencyCode, selectedWalletId, username, guiWallet, exchangeRate, primaryDisplayDenomination, primaryExchangeDenomination }: StateProps =
    useSelector(state => {
      const result = {
        username: state.core.account.username,
        selectedCurrencyCode: state.ui.wallets.selectedCurrencyCode,
        selectedWalletId: state.ui.wallets.selectedWalletId,
        guiWallet: getSelectedWallet(state)
      }

      return {
        ...result,
        exchangeRate: state => getExchangeRate(state, result.selectedCurrencyCode, result.guiWallet.isoFiatCurrencyCode),
        primaryDisplayDenomination: state => getDisplayDenominationFull(state, selectedCurrencyCode),
        primaryExchangeDenomination: state => getExchangeDenomination(state, selectedCurrencyCode)
      }
    })

  if (!guiWallet) return null

  // Create redux actions
  const onLogout = () => dispatch(logoutRequest())
  const onSelectWallet = (walletId: string, currencyCode: string) => dispatch(selectWalletFromModal(selectedWalletId, selectedCurrencyCode))

  // Create variables
  const currencyLogo = getCurrencyIcon(guiWallet.currencyCode, selectedCurrencyCode).symbolImage
  const secondaryExchangeDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)

  return (
    <SceneWrapper hasHeader={false} hasTabs={false}>
      <PanelHeader
        currencyLogo={currencyLogo}
        exchangeRate={exchangeRate}
        selectedCurrencyCode={selectedCurrencyCode}
        primaryDisplayDenomination={primaryDisplayDenomination}
        primaryExchangeDenomination={primaryExchangeDenomination}
        fiatCurrencyCode={guiWallet.fiatCurrencyCode}
        secondaryExchangeDenomination={secondaryExchangeDenomination}
      />
      <AccountList onPress={toggleUserList} username={username} usersView={isViewUserList} />
      {isViewUserList ? <UserList /> : <PanelBody onSelectWallet={onSelectWallet} onLogout={onLogout} />}
    </SceneWrapper>
  )
}
