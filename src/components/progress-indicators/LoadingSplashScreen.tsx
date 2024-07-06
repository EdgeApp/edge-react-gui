import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { DotsBackground } from '../common/DotsBackground'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'

/**
 * This is not a scene component. It's purpose is to be used outside of the
 * react-navigation component hierarchy to get a loading spinner over the app
 * background. Use LoadingScene for rendering a loading state at the scene
 * level (e.g. in HOC).
 */
export const LoadingSplashScreen = () => {
  const theme = useTheme()
  return (
    <ViewContainer>
      <DotsBackground />
      <ActivityIndicator color={theme.loadingIcon} size="large" />
    </ViewContainer>
  )
}

const ViewContainer = styled(View)({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center'
})
