import * as React from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { asSepaInfo, SEPA_FORM_DISKLET_NAME, SepaInfo } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { BuyTabSceneProps } from '../../../types/routerTypes'
import { getDiskletFormData, setDiskletForm } from '../../../util/formUtils'
import { GuiFormField } from '../components/GuiFormField'

export interface FiatPluginSepaFormParams {
  headerTitle: string
  doneLabel: string
  headerIconUri?: string
  onDone: (sepaInfo: SepaInfo) => Promise<void>
  onClose: () => void
}

interface Props extends BuyTabSceneProps<'guiPluginSepaForm'> {}

export const SepaFormScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: headerIconUri
  const { route, navigation } = props
  const { headerTitle, doneLabel, onDone, onClose } = route.params
  const disklet = useSelector(state => state.core.disklet)

  const [name, setName] = React.useState('')
  const [iban, setIban] = React.useState('')
  const [swift, setSwift] = React.useState('')

  const handleNameInput = useHandler((inputValue: string) => {
    setName(inputValue)
  })
  const handleIbanInput = useHandler((inputValue: string) => {
    setIban(inputValue)
  })
  const handleSwiftInput = useHandler((inputValue: string) => {
    setSwift(inputValue)
  })

  const handleSubmit = useHandler(async () => {
    // Save user input to disk
    await setDiskletForm(disklet, SEPA_FORM_DISKLET_NAME, { name, iban, swift })

    await onDone({ name, iban, swift })
  })

  // Initialize scene with any saved forms from disklet
  useAsyncEffect(
    async () => {
      const diskletFormData: SepaInfo | undefined = await getDiskletFormData<SepaInfo>(disklet, SEPA_FORM_DISKLET_NAME, asSepaInfo)
      if (diskletFormData != null) {
        setName(diskletFormData.name)
        setIban(diskletFormData.iban)
        setSwift(diskletFormData.swift)
      }
    },
    [],
    'SepaFormScene'
  )

  // Unmount cleanup
  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (onClose != null) onClose()
    })
  }, [navigation, onClose])

  const scrollContent = (
    <>
      <GuiFormField fieldType="name" value={name} label={lstrings.form_field_title_account_owner} onChangeText={handleNameInput} autofocus />
      <GuiFormField fieldType="iban" value={iban} label={lstrings.form_field_title_iban} onChangeText={handleIbanInput} />
      <GuiFormField fieldType="swift" value={swift} returnKeyType="done" label={lstrings.form_field_title_swift_bic} onChangeText={handleSwiftInput} />
      <SceneButtons
        primary={{
          label: doneLabel,
          disabled: !name.trim() || !iban.trim() || !swift.trim(),
          onPress: handleSubmit
        }}
      />
    </>
  )

  return (
    <SceneWrapper hasTabs hasNotifications avoidKeyboard>
      {({ undoInsetStyle, insetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={headerTitle} underline withTopMargin />
          {Platform.OS === 'ios' ? (
            <ScrollView contentContainerStyle={{ ...insetStyle, ...styles.container }} keyboardShouldPersistTaps="handled">
              {scrollContent}
            </ScrollView>
          ) : (
            <KeyboardAwareScrollView
              contentContainerStyle={{ ...insetStyle, ...styles.container }}
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={theme.rem(2.75)}
              enableAutomaticScroll
              enableOnAndroid
              scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
            >
              {scrollContent}
            </KeyboardAwareScrollView>
          )}
        </View>
      )}
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingTop: 0,
    marginHorizontal: theme.rem(0.5),
    flexGrow: 1
  },
  formSectionTitle: {
    marginLeft: theme.rem(0.5),
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5),
    fontFamily: theme.fontFaceBold
  }
}))
