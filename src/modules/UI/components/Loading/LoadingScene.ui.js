// @flow

import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { THEME } from '../../../../theme/variables/airbitz.js'
import { Gradient } from '../Gradient/Gradient.ui.js'
import SafeAreaView from '../SafeAreaView/SafeAreaView.ui.js'

const rawStyles = {
  scene: { flex: 1 },
  gradient: { height: THEME.HEADER, width: '100%' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
}
const styles = StyleSheet.create(rawStyles)

export const LoadingScene = () => {
  return (
    <SafeAreaView style={styles.scene}>
      <View style={styles.container}>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          <ActivityIndicator size={'large'} />
        </View>
      </View>
    </SafeAreaView>
  )
}
