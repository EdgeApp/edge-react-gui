import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeButton } from '../buttons/EdgeButton'
import { SceneWrapper } from '../common/SceneWrapper'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'

interface Props extends EdgeAppSceneProps<'confirmScene'> {}

export interface ConfirmSceneParams {
  titleText: string
  bodyText: string
  infoTiles?: Array<{ label: string; value: string }>
  onConfirm: (resetSlider: () => void) => Promise<void> | void
  onBack?: () => void
}

const ConfirmSceneComponent = (props: Props) => {
  const { navigation, route } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { titleText, bodyText, infoTiles, onConfirm, onBack } = route.params

  const renderInfoTiles = () => {
    if (infoTiles == null) return null
    return infoTiles.map(({ label, value }) => <EdgeRow key={label} title={label} body={value} />)
  }

  const handleSliderComplete = useHandler(async (resetSlider: () => void) => {
    await onConfirm(resetSlider)
  })

  const handleBackButton = useHandler(() => {
    navigation.pop()
    if (onBack != null) onBack()
  })

  React.useEffect(() => {
    return () => {
      if (onBack != null) onBack()
    }
  }, [onBack])

  return (
    <SceneWrapper scroll padding={theme.rem(0.5)}>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        <SceneHeaderUi4 title={titleText} />
        <View style={styles.body}>
          <EdgeText disableFontScaling numberOfLines={16}>
            {bodyText}
          </EdgeText>
        </View>
        {renderInfoTiles()}
        <View style={styles.footer}>
          <SafeSlider disabled={false} onSlidingComplete={handleSliderComplete} />
          <EdgeButton label={lstrings.string_cancel_cap} type="tertiary" marginRem={1} onPress={handleBackButton} />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

export const ConfirmScene = React.memo(ConfirmSceneComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  titleText: {
    fontSize: theme.rem(2)
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.rem(0.5)
  },
  footer: {
    margin: theme.rem(1),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
