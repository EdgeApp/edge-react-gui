// @flow

import * as React from 'react'
import { View } from 'react-native'

import { selectWalletFromModal } from '../../../../actions/WalletActions.js'
import { SceneWrapper } from '../../../../components/common/SceneWrapper.js'
import { type Theme, cacheStyles, useTheme } from '../../../../components/services/ThemeContext'
import Separator from '../../../../components/themed/Separator'
import { type RootState } from '../../../../reducers/RootReducer.js'
import { useDispatch, useSelector, useState } from '../../../../util/hooks'
import { reduxShallowEqual } from '../../../../util/utils.js'
import { logoutRequest } from '../../../Login/action'
import AccountSwitcher from '../AccountSwitcher/AccountSwitcher.ui'
import PanelCurrency from './components/PanelCurrency'
import PanelDisable from './components/PanelDisable'
import PanelList from './components/PanelList'
import PanelLogo from './components/PanelLogo'

export type StateProps = {
  selectedCurrencyCode: string,
  selectedWalletId: string
}

const selector = (state: RootState) => ({
  selectedWalletId: state.ui.wallets.selectedWalletId,
  selectedCurrencyCode: state.ui.wallets.selectedCurrencyCode
})

export default function ControlPanel() {
  console.debug('RENDER CONTROL PANEL')

  const [isViewUserList, setIsViewUserList] = useState(false)

  const toggleUserList = (value: boolean) => setIsViewUserList(value)

  const dispatch = useDispatch()

  const theme = useTheme()
  const styles = getStyles(theme)

  // Get props from redux state
  const { selectedCurrencyCode, selectedWalletId }: StateProps = useSelector(selector, reduxShallowEqual)

  if (!selectedWalletId) return null

  // // Create redux actions
  const onLogout = () => dispatch(logoutRequest())
  const onSelectWallet = (walletId: string, currencyCode: string) => dispatch(selectWalletFromModal(selectedWalletId, selectedCurrencyCode))

  return (
    <SceneWrapper hasHeader={false} hasTabs={false} isGapTop={false} background="none">
      <View style={styles.panel}>
        <PanelDisable isDisable={isViewUserList} />
        <View style={styles.header}>
          <PanelLogo />
          <PanelCurrency />
          <AccountSwitcher onSwitch={toggleUserList} />
        </View>
        <PanelList onSelectWallet={onSelectWallet} onLogout={onLogout} />
        <Separator style={styles.separator} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  panel: {
    flex: 1,
    backgroundColor: theme.panelBackground,
    position: 'relative',
    paddingHorizontal: theme.rem(1),
    paddingTop: theme.rem(9.5)
  },
  separator: {
    marginBottom: theme.rem(1.5),
    marginTop: theme.rem(1)
  },
  header: {
    borderBottomRightRadius: theme.rem(2),
    borderBottomLeftRadius: theme.rem(2),
    paddingHorizontal: theme.rem(1),
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.panelBackground,
    zIndex: 2
  }
}))
