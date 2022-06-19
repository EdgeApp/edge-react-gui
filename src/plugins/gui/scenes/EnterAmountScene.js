// @flow

import * as React from 'react'
import { Image, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { SceneWrapper } from '../../../components/common/SceneWrapper.js'
import { type Theme, cacheStyles, useTheme } from '../../../components/services/ThemeContext.js'
import { MainButton } from '../../../components/themed/MainButton.js'
import { OutlinedTextInput } from '../../../components/themed/OutlinedTextInput.js'
import { SceneHeader } from '../../../components/themed/SceneHeader.js'
import s from '../../../locales/strings'
import { memo, useCallback, useRef, useState } from '../../../types/reactHooks.js'
import type { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getPartnerIconUri } from '../../../util/CdnUris.js'

type Props = {
  route: RouteProp<'guiPluginEnterAmount'>,
  navigation: NavigationProp<'guiPluginEnterAmount'>
}

export type EnterAmountPoweredBy = { poweredByIcon: string, poweredByText: string, poweredByOnClick: () => Promise<void> | void }

export const FiatPluginEnterAmountScene = memo((props: Props): React.Node => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { headerIconUri, headerTitle, onSubmit, convertValue, onChangeText, label1, label2, initialAmount1 = '', getMethods } = props.route.params
  const [value1, setValue1] = useState<string>(initialAmount1)
  const [value2, setValue2] = useState<string>('')
  const [spinner1, setSpinner1] = useState<boolean>(false)
  const [spinner2, setSpinner2] = useState<boolean>(false)
  const [statusTextContent, setStatusTextContent] = useState<string>('')
  const [statusTextType, setStatusTextType] = useState<'warning' | 'error' | void>()
  const [poweredBy, setPoweredBy] = useState<EnterAmountPoweredBy | void>()
  const firstRun = useRef<boolean>(true)
  const lastUsed = useRef<number>(1)

  if (getMethods != null)
    getMethods({
      setStatusText: params => {
        const { statusText, options = {} } = params
        setStatusTextContent(statusText)
        setStatusTextType(options.textType)
      },
      setPoweredBy
    })

  if (firstRun.current && initialAmount1 != null) {
    convertValue(1, initialAmount1).then(val => {
      if (typeof val === 'string') {
        setValue2(val)
      }
    })
  }
  firstRun.current = false
  let headerIcon = null
  if (headerIconUri != null) {
    headerIcon = <Image style={styles.icon} source={{ uri: headerIconUri }} />
  }

  const handleChangeText1 = useCallback(
    (value: string) => {
      lastUsed.current = 1
      onChangeText(1, value)
      setValue1(value)
      setValue2(' ')
      setSpinner2(true)
      convertValue(1, value).then(v => {
        if (typeof v === 'string') setValue2(v)
        setSpinner2(false)
      })
    },
    [convertValue, onChangeText]
  )
  const handleChangeText2 = useCallback(
    (value: string) => {
      lastUsed.current = 2
      onChangeText(2, value)
      setValue2(value)
      setValue1(' ')
      setSpinner1(true)
      convertValue(2, value).then(v => {
        if (typeof v === 'string') setValue1(v)
        setSpinner1(false)
      })
    },
    [convertValue, onChangeText]
  )
  const handleSubmit = useCallback(() => {
    onSubmit({ lastUsed: lastUsed.current, value1, value2 })
  }, [onSubmit, value1, value2])

  let statusTextStyle = styles.text
  if (statusTextType === 'warning') {
    statusTextStyle = styles.textWarning
  } else if (statusTextType === 'error') {
    statusTextStyle = styles.textError
  }

  const poweredByIconPath = poweredBy != null ? { uri: getPartnerIconUri(poweredBy.poweredByIcon) } : {}
  return (
    <SceneWrapper scroll keyboardShouldPersistTaps="handled" background="theme">
      <SceneHeader style={styles.sceneHeader} title={headerTitle} underline withTopMargin>
        {headerIcon}
      </SceneHeader>
      <View style={styles.container}>
        <View style={styles.textFields}>
          <OutlinedTextInput
            autoCorrect={false}
            autoFocus
            autoCapitalize="none"
            keyboardType="decimal-pad"
            label={label1}
            onChangeText={handleChangeText1}
            onSubmitEditing={handleSubmit}
            showSpinner={spinner1}
            value={value1 ?? '0'}
          />
          <OutlinedTextInput
            autoCorrect={false}
            autoFocus={false}
            autoCapitalize="none"
            keyboardType="decimal-pad"
            label={label2}
            onChangeText={handleChangeText2}
            onSubmitEditing={handleSubmit}
            showSpinner={spinner2}
            value={value2 ?? '0'}
          />
        </View>
        {statusTextContent != null ? <Text style={statusTextStyle}>{statusTextContent}</Text> : null}
        <MainButton label={s.strings.string_next_capitalized} marginRem={[2, 0]} type="secondary" onPress={handleSubmit} />
        {poweredBy != null ? (
          <TouchableOpacity style={styles.poweredByContainer} onPress={poweredBy.poweredByOnClick}>
            <Text style={styles.poweredByText}>{s.strings.plugin_powered_by + ' '}</Text>
            <Image style={styles.poweredByIcon} source={poweredByIconPath} />
            <Text style={styles.poweredByText}>{' ' + poweredBy.poweredByText}</Text>
            <IonIcon name="chevron-forward" size={theme.rem(1)} color={theme.iconTappable} />
          </TouchableOpacity>
        ) : null}
      </View>
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  container: {
    width: '100%',
    alignItems: 'center'
  },
  textFields: {
    flexDirection: 'column',
    minWidth: theme.rem(15),
    maxWidth: theme.rem(20)
  },
  text: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  textWarning: {
    color: theme.warningText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  textError: {
    color: theme.dangerText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  poweredByText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  poweredByIcon: {
    aspectRatio: 1,
    width: theme.rem(0.75),
    height: theme.rem(0.75)
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    marginLeft: theme.rem(0.5),
    resizeMode: 'contain'
  }
}))
