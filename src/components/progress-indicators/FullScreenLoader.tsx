import * as React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle
} from 'react-native'

import { THEME } from '../../theme/variables/airbitz'

interface Props {
  indicatorStyles?: ViewStyle
  size?: 'large' | 'small'
}

export const FullScreenLoader: React.FC<Props> = props => {
  const { indicatorStyles, size = 'large' } = props

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator
        color={THEME.COLORS.ACCENT_MINT}
        style={[styles.indicator, indicatorStyles]}
        size={size}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: THEME.COLORS.OPACITY_GRAY_1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000
  },
  indicator: {
    flex: 1,
    alignSelf: 'center'
  }
})
