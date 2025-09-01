import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useTheme } from '../services/ThemeContext'

export const FillLoader: React.FC = props => {
  const theme = useTheme()

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator
        color={theme.icon}
        style={styles.indicator}
        size="large"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1
  },
  indicator: {
    flex: 1,
    alignSelf: 'center'
  }
})
