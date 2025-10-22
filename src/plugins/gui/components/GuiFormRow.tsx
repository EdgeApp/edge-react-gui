import type React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { useTheme } from '../../../components/services/ThemeContext'

interface Props {
  children: React.ReactNode
}

export const GuiFormRow: React.FC<Props> = ({ children }) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return <View style={styles.row}>{children}</View>
}

const getStyles = cacheStyles(() => ({
  row: {
    flexDirection: 'row'
  }
}))
