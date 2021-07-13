// @flow

import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type Props = {
  route?: RouteProp<any>,
  navigation?: NavigationProp<any>
}

export const LoadingScene = (props: Props) => {
  console.log('!!!', props.route, props.navigation)

  return (
    <SceneWrapper background="header" hasHeader={false} hasTabs={false}>
      <View style={styles.container}>
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} size="large" />
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
