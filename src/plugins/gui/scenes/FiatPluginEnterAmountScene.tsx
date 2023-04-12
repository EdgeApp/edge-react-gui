import * as React from 'react'
import { Image, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { Card } from '../../../components/cards/Card'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { showError } from '../../../components/services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { RouteProp } from '../../../types/routerTypes'
import { getPartnerIconUri } from '../../../util/CdnUris'
import { FiatPluginEnterAmountResponse } from '../fiatPluginTypes'
import { StateManager, useStateManager } from '../hooks/useStateManager'

export interface FiatPluginEnterAmountParams {
  initState?: Partial<any>
  headerTitle: string
  onSubmit: (response: FiatPluginEnterAmountResponse) => Promise<void>
  label1: string
  label2: string
  onChangeText?: (fieldNum: number, value: string) => void
  onFieldChange: (sourceFieldNum: number, value: string, stateManager: StateManager<any>) => void
  onPoweredByClick: (stateManager: StateManager<any>) => void
  headerIconUri?: string
}

export interface EnterAmountState {
  poweredBy?: EnterAmountPoweredBy
  spinner1: boolean
  spinner2: boolean
  statusText: {
    content: string
    textType?: 'warning' | 'error'
  }
  value1: string
  value2: string
}

export interface EnterAmountPoweredBy {
  poweredByIcon: string
  poweredByText: string
}

interface Props {
  route: RouteProp<'guiPluginEnterAmount'>
}

const defaultEnterAmountState: EnterAmountState = {
  spinner1: false,
  spinner2: false,
  statusText: {
    content: ''
  },
  value1: '',
  value2: ''
}

export const FiatPluginEnterAmountScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { initState, headerIconUri, headerTitle, onSubmit, onFieldChange, onPoweredByClick, onChangeText = () => {}, label1, label2 } = props.route.params
  const firstRun = React.useRef<boolean>(true)
  const lastUsed = React.useRef<number>(1)

  const stateManager = useStateManager<EnterAmountState>({ ...defaultEnterAmountState, ...initState })
  const { value1, value2, poweredBy, spinner1, spinner2, statusText } = stateManager.state

  if (firstRun.current && initState?.value1 != null) {
    stateManager.update({ value2: ' ', spinner2: true })
    onFieldChange(1, initState?.value1, stateManager)
  }
  firstRun.current = false
  let headerIcon = null
  if (headerIconUri != null) {
    headerIcon = <Image style={styles.icon} source={{ uri: headerIconUri }} />
  }

  const handleChangeText1 = useHandler((value: string) => {
    lastUsed.current = 1
    onChangeText(1, value)
    stateManager.update({ value1: value, value2: ' ', spinner2: true })
    onFieldChange(1, value, stateManager)
  })
  const handleChangeText2 = useHandler((value: string) => {
    lastUsed.current = 2
    onChangeText(2, value)
    stateManager.update({ value1: ' ', value2: value, spinner1: true })
    onFieldChange(2, value, stateManager)
  })
  const handlePoweredByPress = useHandler(() => onPoweredByClick(stateManager))
  const handleSubmit = useHandler(() => {
    onSubmit({ lastUsed: lastUsed.current, value1, value2 }).catch(showError)
  })

  let statusTextStyle = styles.text
  if (statusText.textType === 'warning') {
    statusTextStyle = styles.textWarning
  } else if (statusText.textType === 'error') {
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
        {statusText != null ? <Text style={statusTextStyle}>{statusText.content}</Text> : null}
        {poweredBy != null ? (
          <View style={styles.cardContainer}>
            <TouchableOpacity onPress={handlePoweredByPress}>
              <Card paddingRem={0.5}>
                <View style={styles.poweredByContainer}>
                  <Image style={styles.poweredByIcon} source={poweredByIconPath} />

                  <View style={styles.poweredByContainerColumn}>
                    <View style={styles.poweredByContainerRow}>
                      <Text style={styles.poweredByText}>{lstrings.plugin_powered_by_space}</Text>
                      <Text style={styles.poweredByText}>{poweredBy.poweredByText}</Text>
                    </View>
                    <View style={styles.poweredByContainerRow}>
                      <Text style={styles.tapToChangeText}>{lstrings.tap_to_change_provider}</Text>
                    </View>
                  </View>

                  <IonIcon name="chevron-forward" size={theme.rem(1)} color={theme.iconTappable} />
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        ) : null}
        <MainButton label={lstrings.string_next_capitalized} marginRem={[1, 0]} type="secondary" onPress={handleSubmit} />
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
    alignItems: 'center',
    paddingTop: theme.rem(0.5),
    width: '100%'
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
