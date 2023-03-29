import * as React from 'react'
import { ActivityIndicator, StyleSheet, View, ViewPropTypes } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'

interface Props {
  // @ts-expect-error
  indicatorStyles?: ViewPropTypes.style
  size?: 'large' | 'small'
}

export class FillLoader extends React.Component<Props> {
  render() {
    const { size = 'large', indicatorStyles } = this.props
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={[styles.indicator, indicatorStyles]} size={size} />
      </View>
    )
  }
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
