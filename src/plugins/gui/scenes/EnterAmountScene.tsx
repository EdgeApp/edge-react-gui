import * as React from 'react'
import { Image, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { Card } from '../../../components/cards/Card'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { RouteProp } from '../../../types/routerTypes'
import { getPartnerIconUri } from '../../../util/CdnUris'

interface Props {
  route: RouteProp<'guiPluginEnterAmount'>
}

export interface EnterAmountPoweredBy {
  poweredByIcon: string
  poweredByText: string
  poweredByOnClick: () => void
}

export const FiatPluginEnterAmountScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { headerIconUri, headerTitle, onSubmit, convertValue, onChangeText, label1, label2, initialAmount1 = '', getMethods } = props.route.params
  const [value1, setValue1] = React.useState<string>(initialAmount1)
  const [value2, setValue2] = React.useState<string>('')
  const [spinner1, setSpinner1] = React.useState<boolean>(false)
  const [spinner2, setSpinner2] = React.useState<boolean>(false)
  const [statusTextContent, setStatusTextContent] = React.useState<string>('')
  const [statusTextType, setStatusTextType] = React.useState<'warning' | 'error' | undefined>()
  const [poweredBy, setPoweredBy] = React.useState<EnterAmountPoweredBy | undefined>()
  const firstRun = React.useRef<boolean>(true)
  const lastUsed = React.useRef<number>(1)

  const formattedSetValue1 = useHandler((value: string) => {
    setValue1(value)
  })

  const formattedSetValue2 = useHandler((value: string) => {
    setValue2(value)
  })

  if (getMethods != null)
    getMethods({
      setStatusText: params => {
        const { statusText, options = {} } = params
        setStatusTextContent(statusText)
        setStatusTextType(options.textType)
      },
      setPoweredBy,
      setValue1: formattedSetValue1,
      setValue2: formattedSetValue2
    })

  if (firstRun.current && initialAmount1 != null) {
    setValue2(' ')
    setSpinner2(true)
    convertValue(1, initialAmount1).then(val => {
      if (typeof val === 'string') {
        setValue2(val)
        setSpinner2(false)
      }
    })
  }
  firstRun.current = false
  let headerIcon = null
  if (headerIconUri != null) {
    headerIcon = <Image style={styles.icon} source={{ uri: headerIconUri }} />
  }

  const handleChangeText1 = useHandler((value: string) => {
    lastUsed.current = 1
    onChangeText(1, value)
    setValue1(value)
    setValue2(' ')
    setSpinner2(true)
    convertValue(1, value).then(v => {
      if (typeof v === 'string') setValue2(v)
      setSpinner2(false)
    })
  })
  const handleChangeText2 = useHandler((value: string) => {
    lastUsed.current = 2
    onChangeText(2, value)
    setValue2(value)
    setValue1(' ')
    setSpinner1(true)
    convertValue(2, value).then(v => {
      if (typeof v === 'string') setValue1(v)
      setSpinner1(false)
    })
  })
  const handleSubmit = useHandler(() => {
    onSubmit({ lastUsed: lastUsed.current, value1, value2 })
  })

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
            numeric
            maxDecimals={2}
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
            numeric
            maxDecimals={6}
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
        {poweredBy != null ? (
          <View style={styles.cardContainer}>
            <TouchableOpacity onPress={poweredBy.poweredByOnClick}>
              <Card paddingRem={0.5}>
                <View style={styles.poweredByContainer}>
                  <Image style={styles.poweredByIcon} source={poweredByIconPath} />

                  <View style={styles.poweredByContainerColumn}>
                    <View style={styles.poweredByContainerRow}>
                      <Text style={styles.poweredByText}>{s.strings.plugin_powered_by_space}</Text>
                      <Text style={styles.poweredByText}>{poweredBy.poweredByText}</Text>
                    </View>
                    <View style={styles.poweredByContainerRow}>
                      <Text style={styles.tapToChangeText}>{s.strings.tap_to_change_provider}</Text>
                    </View>
                  </View>

                  <IonIcon name="chevron-forward" size={theme.rem(1)} color={theme.iconTappable} />
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        ) : null}
        <MainButton label={s.strings.string_next_capitalized} marginRem={[1, 0]} type="secondary" onPress={handleSubmit} />
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
  cardContainer: {
    paddingTop: theme.rem(1),
    paddingBottom: theme.rem(1),
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
  poweredByContainerRow: {
    flexDirection: 'row'
  },
  poweredByContainerColumn: {
    paddingHorizontal: theme.rem(0.5),
    flexDirection: 'column'
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  poweredByText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  tapToChangeText: {
    fontSize: theme.rem(0.75),
    color: theme.deactivatedText
  },
  poweredByIcon: {
    aspectRatio: 1,
    width: theme.rem(2),
    height: theme.rem(2)
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    marginLeft: theme.rem(0.5),
    resizeMode: 'contain'
  }
}))
