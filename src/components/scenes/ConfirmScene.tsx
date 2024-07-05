import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeader } from '../themed/SceneHeader'

interface Props extends EdgeSceneProps<'confirmScene'> {}

export interface ConfirmSceneParams {
  titleText: string
  bodyText: string
  infoTiles?: Array<{ label: string; value: string }>
  onConfirm: (resetSlider: () => void) => Promise<void> | void
  onBack?: () => void
}

const ConfirmComponent = (props: Props) => {
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
    <SceneWrapper>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        <SceneHeader title={titleText} underline />
        <View style={styles.body}>
          <EdgeText disableFontScaling numberOfLines={16}>
            {bodyText}
          </EdgeText>
        </View>
        {renderInfoTiles()}
        <View style={styles.footer}>
          <SafeSlider disabled={false} onSlidingComplete={handleSliderComplete} />
          <MainButton label={lstrings.string_cancel_cap} type="escape" marginRem={0.5} onPress={handleBackButton} />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

export const ConfirmScene = React.memo(ConfirmComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  titleText: {
    fontSize: theme.rem(2)
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.rem(1),
    marginTop: theme.rem(1.5)
  },
  footer: {
    margin: theme.rem(1),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
