import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'

export const HeaderBackground = () => {
  const theme = useTheme()

  return (
    <HeaderBackgroundContainerView>
      <HeaderLinearGradient colors={theme.headerBackground} start={theme.headerBackgroundStart} end={theme.headerBackgroundEnd} />
      <DividerLine colors={theme.headerOutlineColors} />
    </HeaderBackgroundContainerView>
  )
}

const HeaderBackgroundContainerView = styled(View)({
  ...StyleSheet.absoluteFillObject,
  alignItems: 'stretch',
  justifyContent: 'flex-end'
})

const HeaderLinearGradient = styled(LinearGradient)({
  flex: 1
})
