// @flow
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { styles } from '../../styles/components/FullScreenLoaderStyles'

type Props = {
  size?: 'large' | 'small'
}

class FullScreenLoader extends Component<Props> {
  render () {
    const { size } = this.props
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator style={styles.indicator} size={size || 'large'} />
      </View>
    )
  }
}

export default FullScreenLoader
