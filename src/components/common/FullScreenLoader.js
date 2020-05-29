// @flow
import React, { Component } from 'react'
import { ActivityIndicator, View, ViewPropTypes } from 'react-native'

import { styles } from '../../styles/components/FullScreenLoaderStyles'

type Props = {
  indicatorStyles?: ViewPropTypes.style,
  size?: 'large' | 'small'
}

class FullScreenLoader extends Component<Props> {
  render() {
    const { size, indicatorStyles } = this.props
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator style={[styles.indicator, indicatorStyles]} size={size || 'large'} />
      </View>
    )
  }
}

export default FullScreenLoader
