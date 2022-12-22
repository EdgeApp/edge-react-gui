import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import s from '../../locales/strings'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeader } from '../themed/SceneHeader'

interface OwnProps {
  headerText: string
  headerTertiary?: React.ReactNode
  children?: React.ReactNode
  onSliderComplete: (reset: () => void) => Promise<void>
  sliderDisabled: boolean
}

type Props = OwnProps

export const FormScene = (props: Props) => {
  const { headerText, headerTertiary, children, onSliderComplete, sliderDisabled } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <SceneWrapper background="theme">
      <SceneHeader title={headerText} tertiary={headerTertiary} withTopMargin underline />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {children}
        <View style={styles.footer}>
          <SafeSlider onSlidingComplete={onSliderComplete} disabled={sliderDisabled} disabledText={s.strings.send_confirmation_slide_to_confirm} />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  footer: {
    margin: theme.rem(2),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
