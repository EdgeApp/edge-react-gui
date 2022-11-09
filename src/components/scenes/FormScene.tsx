import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

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
      <SceneHeader style={styles.sceneHeader} title={headerText} tertiary={headerTertiary} withTopMargin underline />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {children}
        <View style={styles.footer}>
          <SafeSlider onSlidingComplete={onSliderComplete} disabled={sliderDisabled} />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  sceneHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  footer: {
    margin: theme.rem(2),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
