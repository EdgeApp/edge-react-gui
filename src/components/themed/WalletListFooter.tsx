import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { ButtonsContainer } from '../buttons/ButtonsContainer'
import { TransferModal } from '../modals/TransferModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  navigation: NavigationProp<'walletList'>
}

/**
 * Renders the footer component for the WalletList screen.
 */
export const WalletListFooter = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)

  const handleSend = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="send" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  const handleDeposit = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="deposit" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  return (
    <View style={styles.container}>
      <ButtonsContainer
        layout="row"
        secondary2={{
          onPress: handleSend,
          label: lstrings.fragment_send_subtitle
        }}
        secondary={{
          onPress: handleDeposit,
          label: lstrings.loan_fragment_deposit
        }}
      />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    borderTopColor: theme.lineDivider,
    borderTopWidth: theme.thinLineWidth,
    paddingVertical: theme.rem(0.75)
  }
}))
