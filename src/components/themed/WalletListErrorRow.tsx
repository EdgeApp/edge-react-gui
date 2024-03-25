import * as React from 'react'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  onLongPress?: () => void
  error: Error
}

function WalletListErrorRowComponent(props: Props) {
  const { onLongPress, error } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <EdgeTouchableOpacity style={styles.container} onLongPress={onLongPress}>
      <EntypoIcon name="warning" size={theme.rem(1)} style={styles.icon} />
      <EdgeText>{error.message}</EdgeText>
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  },
  icon: {
    color: theme.warningIcon,
    minWidth: theme.rem(1.5),
    textAlign: 'center'
  }
}))

export const WalletListErrorRow = React.memo(WalletListErrorRowComponent)
