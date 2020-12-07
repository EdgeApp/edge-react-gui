// @flow
import * as React from 'react'
import { View } from 'react-native'
import { connect } from 'react-redux'

import type { RootState } from '../../types/reduxTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { WalletProgressIcon } from '../themed/WalletProgressIcon.js'

function WalletProgressIconHeaderComponent(props: { selectedWalletId: string }) {
  const styles = getStyles(useTheme())
  return (
    <View style={styles.container}>
      <WalletProgressIcon walletId={props.selectedWalletId} />
    </View>
  )
}

export const WalletProgressIconHeader = connect((state: RootState): { selectedWalletId: string } => ({
  selectedWalletId: state.ui.wallets.selectedWalletId
}))(WalletProgressIconHeaderComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.rem(1.5)
  }
}))
