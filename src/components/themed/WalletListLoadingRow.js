// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableOpacity } from 'react-native'

import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {|
  onLongPress?: () => void,
  onPress?: () => void
|}

function WalletListLoadingRowComponent(props: Props) {
  const { onLongPress, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity style={styles.container} onLongPress={onLongPress} onPress={onPress}>
      <ActivityIndicator color={theme.primaryText} size="large" />
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  }
}))

export const WalletListLoadingRow = memo(WalletListLoadingRowComponent)
