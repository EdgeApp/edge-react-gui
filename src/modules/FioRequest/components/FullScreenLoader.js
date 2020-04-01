// @flow
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'

import styles from '../../../styles/components/FullScreenLoaderStyles'

type Props = {}

class FullScreenLoader extends Component<Props> {
  render () {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator style={styles.indicator} size={'large'} />
      </View>
    )
  }
}

export default FullScreenLoader
