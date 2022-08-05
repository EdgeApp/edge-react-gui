// @flow

import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { useMemo } from '../../types/reactHooks.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, useTheme } from '../services/ThemeContext.js'
import { SceneHeader } from '../themed/SceneHeader'
import { SmartSlider } from '../themed/SmartSlider'

type OwnProps = {
  headerText: string,
  children?: React.Node,
  onSliderComplete: (reset: () => void) => Promise<void>,
  sliderDisabled: boolean
}

type Props = OwnProps

export const FormScene = (props: Props) => {
  const { headerText, children, onSliderComplete, sliderDisabled } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const sceneHeader = useMemo(() => <SceneHeader style={styles.sceneHeader} title={headerText} withTopMargin />, [headerText, styles.sceneHeader])

  return (
    <SceneWrapper background="theme">
      {sceneHeader}
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {children}
        <View style={styles.footer}>
          <SmartSlider onSlidingComplete={onSliderComplete} disabled={sliderDisabled} />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  footer: {
    marginBottom: theme.rem(2)
  }
}))
