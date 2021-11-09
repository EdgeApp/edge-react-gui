// @flow

import * as React from 'react'
import { View } from 'react-native'

import { logoutRequest } from '../../actions/LoginActions.js'
import { selectWalletFromModal } from '../../actions/WalletActions.js'
import { type RootState } from '../../reducers/RootReducer.js'
import { useState } from '../../types/reactHooks'
import { reduxShallowEqual, useDispatch, useSelector } from '../../types/reactRedux'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { PanelCurrency, PanelList, PanelLogo } from '../themed/ControlPanel'
import { Fade } from '../themed/Fade'
import Separator from '../themed/Separator'
import { AccountSwitcher } from './AccountSwitcher'

export type StateProps = {
  selectedCurrencyCode: string,
  selectedWalletId: string
}

const selector = (state: RootState) => ({
  selectedWalletId: state.ui.wallets.selectedWalletId,
  selectedCurrencyCode: state.ui.wallets.selectedCurrencyCode
})

type Props = { navigation: { state: { isDrawerOpen: Boolean } } }

export default function ControlPanel({
  navigation: {
    state: { isDrawerOpen }
  }
}: Props) {
  const [isViewUserList, setIsViewUserList] = useState(false)

  const dispatch = useDispatch()

  const theme = useTheme()
  const styles = getStyles(theme)

  const { selectedCurrencyCode, selectedWalletId }: StateProps = useSelector(selector, reduxShallowEqual)

  if (!selectedWalletId) return null

  const onLogout = () => dispatch(logoutRequest())
  const onSelectWallet = (walletId: string, currencyCode: string) => dispatch(selectWalletFromModal(selectedWalletId, selectedCurrencyCode))

  return (
    <SceneWrapper hasHeader={false} hasTabs={false} isGapTop={false} background="none">
      <View style={styles.panel}>
        <View style={styles.header}>
          <PanelLogo />
          <PanelCurrency />
          <AccountSwitcher onSwitch={setIsViewUserList} forceClose={!isDrawerOpen} />
        </View>
        <Fade visible={isViewUserList} fadeInOpacity={0.8} />
        <PanelList onSelectWallet={onSelectWallet} onLogout={onLogout} />
        <Separator style={styles.separator} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  panel: {
    flex: 1,
    backgroundColor: theme.modal,
    position: 'relative',
    paddingLeft: theme.rem(1.2),
    paddingRight: theme.rem(2),
    paddingTop: theme.rem(13),
    borderBottomLeftRadius: theme.rem(2),
    borderTopLeftRadius: theme.rem(2)
  },
  separator: {
    marginBottom: theme.rem(2),
    marginTop: theme.rem(1),
    marginRight: theme.rem(-2)
  },
  header: {
    borderBottomRightRadius: theme.rem(2),
    borderBottomLeftRadius: theme.rem(2),
    paddingLeft: theme.rem(1.2),
    paddingRight: theme.rem(2),
    borderTopLeftRadius: theme.rem(2),
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.modal,
    zIndex: 2
  },
  disable: {
    backgroundColor: theme.fadeDisable,
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: theme.rem(2),
    borderBottomLeftRadius: theme.rem(2)
  }
}))
