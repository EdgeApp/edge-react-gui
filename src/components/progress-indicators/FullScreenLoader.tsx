import * as React from 'react'
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'

type Props = {
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

const rawStyles: { loadingContainer: ViewStyle; indicator: ViewStyle } = {
  loadingContainer: {
    flex: 1,
    position: 'absolute',
    height: PLATFORM.deviceHeight,
    width: PLATFORM.deviceWidth,
    backgroundColor: THEME.COLORS.OPACITY_GRAY_1,
    zIndex: 1000
  },
  indicator: {
    flex: 1,
    alignSelf: 'center'
  }
}

const styles: typeof rawStyles = StyleSheet.create(rawStyles)
