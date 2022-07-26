// @flow

import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { LoanStatusScene } from './Loans/LoanStatusScene.js'

export const LoadingScene = () => {
  return (
    <SceneWrapper background="header" hasHeader={false} hasTabs={false}>
      <LoanStatusScene />
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
