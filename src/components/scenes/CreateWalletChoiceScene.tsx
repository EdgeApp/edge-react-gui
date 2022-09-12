import * as React from 'react'
import { View } from 'react-native'

import CreateWalletSvg from '../../assets/images/create-wallet.svg'
import { useHandler } from '../../hooks/useHandler'
import { useLayout } from '../../hooks/useLayout'
import s from '../../locales/strings'
import { useMemo } from '../../types/reactHooks'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'

type OwnProps = {
  navigation: NavigationProp<'createWalletChoice'>
  route: RouteProp<'createWalletChoice'>
}

type Props = OwnProps

const mainButtonMarginRem = [1, 1]

export const CreateWalletChoiceScene = (props: Props) => {
  const { navigation, route } = props
  const { selectedWalletType } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const onSelectNew = useHandler(() => {
    navigation.navigate('createWalletSelectFiat', {
      selectedWalletType
    })
  })

  const onSelectRestore = useHandler(() => {
    navigation.navigate('createWalletImport', {
      selectedWalletType
    })
  })

  // Scale the icon to match the height of the first MainButton container for consistency
  const [iconContainerLayout, setIconContainerLayout] = useLayout()
  const svgHeightToWidthRatio = 62 / 58 // Original SVG height and width
  const svgHeight = iconContainerLayout.height
  const svgWidth = svgHeightToWidthRatio * svgHeight

  const sceneHeader = useMemo(() => <SceneHeader withTopMargin title={s.strings.title_create_wallet} />, [])

  return (
    <SceneWrapper avoidKeyboard background="theme">
      {sceneHeader}
      <View style={styles.icon}>
        <CreateWalletSvg color={theme.iconTappable} height={svgHeight} width={svgWidth} />
      </View>
      <EdgeText style={styles.instructionalText} numberOfLines={2}>
        {s.strings.create_wallet_choice_instructions}
      </EdgeText>
      <View onLayout={setIconContainerLayout}>
        <MainButton
          alignSelf="stretch"
          label={s.strings.create_wallet_choice_new_button}
          marginRem={mainButtonMarginRem}
          type="secondary"
          onPress={onSelectNew}
        />
      </View>
      <MainButton alignSelf="stretch" label={s.strings.create_wallet_import_title} type="escape" onPress={onSelectRestore} />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: theme.rem(1)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    paddingHorizontal: theme.rem(1),
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(2),
    marginHorizontal: theme.rem(2.5),
    textAlign: 'center'
  }
}))
