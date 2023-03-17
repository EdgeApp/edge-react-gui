import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { getDiskletFormData, setDiskletForm } from '../../../actions/FormActions'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { asSepaInfo, SEPA_FORM_DISKLET_NAME, SepaInfo } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { RouteProp } from '../../../types/routerTypes'
import { GuiFormField } from '../components/GuiFormField'

interface Props {
  route: RouteProp<'guiPluginSepaForm'>
}

export const SepaFormScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: headerIconUri
  const { headerTitle, onSubmit } = props.route.params
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

    onSubmit({ name, iban, swift })
  })

  // Initialize scene with any saved forms from disklet
  useAsyncEffect(async () => {
    const diskletFormData: SepaInfo | undefined = await getDiskletFormData<SepaInfo>(disklet, SEPA_FORM_DISKLET_NAME, asSepaInfo)
    if (diskletFormData != null) {
      setName(diskletFormData.name)
      setIban(diskletFormData.iban)
      setSwift(diskletFormData.swift)
    }
  }, [])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" extraScrollHeight={theme.rem(2.75)} enableAutomaticScroll enableOnAndroid>
        <SceneHeader title={headerTitle} underline withTopMargin />
        <EdgeText style={styles.formSectionTitle}>{s.strings.bank_info}</EdgeText>
        <GuiFormField fieldType="name" value={name} label={s.strings.account_owner} onChangeText={handleNameInput} autofocus />
        <GuiFormField fieldType="iban" value={iban} label={s.strings.iban} onChangeText={handleIbanInput} />
        <GuiFormField fieldType="swift" value={swift} returnKeyType="done" label={s.strings.swift_bic} onChangeText={handleSwiftInput} />
        <MainButton
          label={s.strings.string_next_capitalized}
          marginRem={[1, 0.5, 1, 0.5]}
          type="secondary"
          disabled={!name.trim() || !iban.trim() || !swift.trim()}
          onPress={handleSubmit}
        />
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  formSectionTitle: {
    marginLeft: theme.rem(0.5),
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5),
    fontFamily: theme.fontFaceBold
  }
}))
