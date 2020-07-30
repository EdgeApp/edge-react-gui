// @flow

import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { SceneWrapper } from '../common/SceneWrapper.js'

export const LoadingScene = () => {
  return (
    <SceneWrapper hasHeader={false} hasTabs={false}>
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    </SceneWrapper>
  )
}

const rawStyles = {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
