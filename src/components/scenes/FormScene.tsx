import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { useMemo } from '../../types/reactHooks'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeader } from '../themed/SceneHeader'

type OwnProps = {
  headerText: string
  children?: React.ReactNode
  onSliderComplete: (reset: () => void) => Promise<void>
  sliderDisabled: boolean
}

type Props = OwnProps

export const FormScene = (props: Props) => {
  const { headerText, children, onSliderComplete, sliderDisabled } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const sceneHeader = useMemo(() => <SceneHeader style={styles.sceneHeader} title={headerText} underline />, [headerText, styles.sceneHeader])

  return (
    <SceneWrapper background="theme">
      {sceneHeader}
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
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  footer: {
    margin: theme.rem(2),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
