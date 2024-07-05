import * as React from 'react'
import { View } from 'react-native'

import { ButtonsView } from '../../../components/buttons/ButtonsView'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { asSepaInfo, SEPA_FORM_DISKLET_NAME, SepaInfo } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getDiskletFormData, setDiskletForm } from '../../../util/formUtils'
import { GuiFormField } from '../components/GuiFormField'

interface Props extends EdgeSceneProps<'guiPluginSepaForm'> {}

export const SepaFormScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: headerIconUri
  const { route } = props
  const { headerTitle, onSubmit } = route.params
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

    await onSubmit({ name, iban, swift })
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

  return (
    <SceneWrapper hasNotifications>
      <SceneHeader title={headerTitle} underline withTopMargin />
      <View style={styles.container}>
        <GuiFormField fieldType="name" value={name} label={lstrings.form_field_title_account_owner} onChangeText={handleNameInput} autofocus />
        <GuiFormField fieldType="iban" value={iban} label={lstrings.form_field_title_iban} onChangeText={handleIbanInput} />
        <GuiFormField fieldType="swift" value={swift} returnKeyType="done" label={lstrings.form_field_title_swift_bic} onChangeText={handleSwiftInput} />
        <ButtonsView
          primary={{
            label: lstrings.string_next_capitalized,
            disabled: !name.trim() || !iban.trim() || !swift.trim(),
            onPress: handleSubmit
          }}
          parentType="scene"
        />
      </View>
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    margin: theme.rem(0.5),
    flexGrow: 1
  },
  formSectionTitle: {
    marginLeft: theme.rem(0.5),
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5),
    fontFamily: theme.fontFaceBold
  }
}))
