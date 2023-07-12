import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { lstrings } from '../../locales/strings'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeader } from '../themed/SceneHeader'

interface Props {
  headerText: string
  headerTertiary?: React.ReactNode
  children?: React.ReactNode
  onSliderComplete: (reset: () => void) => Promise<void>
  sliderDisabled: boolean
}

export const FormScene = (props: Props) => {
  const { headerText, headerTertiary, children, onSliderComplete, sliderDisabled } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <SceneWrapper background="theme">
      <SceneHeader tertiary={headerTertiary} title={headerText} underline withTopMargin />
      <KeyboardAwareScrollView contentContainerStyle={styles.container} extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {children}
        <View style={styles.footer}>
          <SafeSlider onSlidingComplete={onSliderComplete} disabled={sliderDisabled} disabledText={lstrings.send_confirmation_slide_to_confirm} />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingTop: theme.rem(0.5)
  },
  footer: {
    margin: theme.rem(2),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
