import * as React from 'react'
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'

interface Props {
  indicatorStyles?: ViewStyle
  size?: 'large' | 'small'
}

export class FullScreenLoader extends React.Component<Props> {
  render() {
    const { size, indicatorStyles } = this.props
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={[styles.indicator, indicatorStyles]} size={size || 'large'} />
      </View>
    )
  }
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
