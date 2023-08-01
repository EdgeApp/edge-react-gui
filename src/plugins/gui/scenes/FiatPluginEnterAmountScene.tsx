import * as React from 'react'
import { useEffect } from 'react'
import { Image, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { Card } from '../../../components/cards/Card'
import { NotificationSceneWrapper } from '../../../components/common/SceneWrapper'
import { showError } from '../../../components/services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getPartnerIconUri } from '../../../util/CdnUris'
import { FiatPluginEnterAmountResponse } from '../fiatPluginTypes'
import { StateManager, useStateManager } from '../hooks/useStateManager'

export interface FiatPluginEnterAmountParams {
  initState?: Partial<any>
  headerTitle: string
  label1: string
  label2: string
  onChangeText?: (event: { fieldNum: number; value: string }, stateManager: StateManager<EnterAmountState>) => Promise<void>
  convertValue: (sourceFieldNum: number, value: string, stateManager: StateManager<EnterAmountState>) => Promise<string | undefined>
  onPoweredByClick: (stateManager: StateManager<EnterAmountState>) => Promise<void>
  onSubmit: (event: { response: FiatPluginEnterAmountResponse }, stateManager: StateManager<EnterAmountState>) => Promise<void>
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

interface Props extends EdgeSceneProps<'guiPluginEnterAmount'> {}

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
  const { navigation, route } = props
  const { initState, headerIconUri, headerTitle, onSubmit, convertValue, onPoweredByClick, onChangeText = () => {}, label1, label2 } = route.params
  const lastUsed = React.useRef<number>(1)

  const stateManager = useStateManager<EnterAmountState>({ ...defaultEnterAmountState, ...initState })
  const { value1, value2, poweredBy, spinner1, spinner2, statusText } = stateManager.state

  useEffect(() => {
    if (initState?.value1 != null) {
      stateManager.update({ value2: ' ', spinner2: true })
      convertValue(1, initState?.value1, stateManager)
        .then(otherValue => {
          if (typeof otherValue === 'string') {
            stateManager.update({ value2: otherValue, spinner2: false })
          }
        })
        .catch(err => showError(err))
    }
  }, [initState?.value1, convertValue, stateManager])

  let headerIcon = null
  if (headerIconUri != null) {
    headerIcon = <Image style={styles.icon} source={{ uri: headerIconUri }} />
  }

  const handleChangeText1 = useHandler((value: string) => {
    lastUsed.current = 1
    onChangeText({ fieldNum: 1, value }, stateManager)?.catch(err => showError(err))
    stateManager.update({ value1: value, spinner2: true })
    convertValue(1, value, stateManager)
      .then(otherValue => {
        if (typeof otherValue === 'string') {
          stateManager.update({ value2: otherValue })
        }
      })
      .catch(err => showError(err))
      .finally(() => {
        stateManager.update({ spinner2: false })
      })
  })
  const handleChangeText2 = useHandler((value: string) => {
    lastUsed.current = 2
    onChangeText({ fieldNum: 2, value }, stateManager)?.catch(err => showError(err))
    stateManager.update({ value2: value, spinner1: true })
    convertValue(2, value, stateManager)
      .then(otherValue => {
        if (typeof otherValue === 'string') {
          stateManager.update({ value1: otherValue, spinner1: false })
        }
      })
      .catch(err => showError(err))
      .finally(() => {
        stateManager.update({ spinner1: false })
      })
  })
  const handlePoweredByPress = useHandler(async () => await onPoweredByClick(stateManager))
  const handleSubmit = useHandler(async () => {
    await onSubmit({ response: { lastUsed: lastUsed.current, value1, value2 } }, stateManager).catch(showError)
  })

  let statusTextStyle = styles.text
  if (statusText.textType === 'warning') {
    statusTextStyle = styles.textWarning
  } else if (statusText.textType === 'error') {
    statusTextStyle = styles.textError
  }

  const poweredByIconPath = poweredBy != null ? { uri: getPartnerIconUri(poweredBy.poweredByIcon) } : {}
  return (
    <NotificationSceneWrapper navigation={navigation} scroll keyboardShouldPersistTaps="handled" background="theme">
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
        <MainButton disabled={spinner1 || spinner2} label={lstrings.string_next_capitalized} marginRem={[1, 0]} type="secondary" onPress={handleSubmit} />
      </View>
    </NotificationSceneWrapper>
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
