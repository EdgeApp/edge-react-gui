import * as React from 'react'
import { ActivityIndicator, TouchableOpacity } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  onLongPress?: () => void
  onPress?: () => void
}

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

export const WalletListLoadingRow = React.memo(WalletListLoadingRowComponent)
