// @flow

import { ViewPropTypes } from 'deprecated-react-native-prop-types'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'

type Props = {
  indicatorStyles?: ViewPropTypes.style,
  size?: 'large' | 'small'
}

export class FillLoader extends React.Component<Props> {
  render() {
    const { size, indicatorStyles } = this.props
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={[styles.indicator, indicatorStyles]} size={size || 'large'} />
      </View>
    )
  }
}

const rawStyles = {
  loadingContainer: {
    flex: 1
  },
  indicator: {
    flex: 1,
    alignSelf: 'center'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
