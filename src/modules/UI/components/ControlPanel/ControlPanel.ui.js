// @flow

import * as React from 'react'
import { View } from 'react-native'

import { selectWalletFromModal } from '../../../../actions/WalletActions.js'
import { SceneWrapper } from '../../../../components/common/SceneWrapper.js'
import { type Theme, cacheStyles, useTheme } from '../../../../components/services/ThemeContext'
import Separator from '../../../../components/themed/Separator'
import type { GuiDenomination, GuiExchangeRates, GuiWallet } from '../../../../types/types.js'
import { getCurrencyIcon } from '../../../../util/CurrencyInfoHelpers.js'
import { useDispatch, useSelector, useState } from '../../../../util/hooks'
import { getDenomFromIsoCode } from '../../../../util/utils.js'
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
  exchangeRate?: number,
  primaryDisplayDenomination: GuiDenomination,
  primaryExchangeDenomination: GuiDenomination
}

export default function ControlPanel() {
  const [isViewUserList, setIsViewUserList] = useState(false)

  const toggleUserList = () => setIsViewUserList(!isViewUserList)

  const dispatch = useDispatch()

  const theme = useTheme()
  const styles = getStyles(theme)

  // Get props from redux state
  const { selectedCurrencyCode, selectedWalletId, username, guiWallet, exchangeRate, primaryDisplayDenomination, primaryExchangeDenomination }: StateProps =
    useSelector(state => {
      const guiWallet = getSelectedWallet(state)
      const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode

      return {
        username: state.core.account.username,
        selectedWalletId: state.ui.wallets.selectedWalletId,
        guiWallet,
        selectedCurrencyCode,
        exchangeRate: guiWallet ? getExchangeRate(state, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode) : null,
        primaryDisplayDenomination: guiWallet ? getDisplayDenominationFull(state, selectedCurrencyCode) : null,
        primaryExchangeDenomination: guiWallet ? getExchangeDenomination(state, selectedCurrencyCode) : null
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
    <SceneWrapper hasHeader={false} hasTabs={false} isGapTop={false} background="none">
      <View style={styles.panel}>
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
        <Separator />
        {isViewUserList ? <UserList /> : <PanelBody onSelectWallet={onSelectWallet} onLogout={onLogout} />}
        <Separator style={styles.bottomSeparator} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  panel: {
    paddingLeft: theme.rem(1),
    flex: 1,
    backgroundColor: theme.panelBackground
  },
  bottomSeparator: {
    marginBottom: theme.rem(2.5),
    marginTop: theme.rem(1)
  }
}))
