import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { getDiskletFormData, setDiskletForm } from '../../../actions/FormActions'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput, OutlinedTextInputRef } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { asSepaInfo, SepaInfo } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { RouteProp } from '../../../types/routerTypes'

interface Props {
  route: RouteProp<'guiPluginSepaForm'>
}

const SEPA_FORM_DISKLET_NAME = 'sepaInfo'
const SEPA_FORM_TITLE_MAP: { readonly [key: string]: string } = {
  name: s.strings.account_owner,
  iban: s.strings.iban,
  swift: s.strings.swift_code
}

export const SepaFormScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  // TODO: headerIconUri
  const { headerTitle, onSubmit } = props.route.params
  const disklet = useSelector(state => state.core.disklet)

  const [formData, setFormData] = React.useState<SepaInfo>({
    name: '',
    iban: '',
    swift: ''
  })

  const inputRefs = React.useRef<{ [key: string]: OutlinedTextInputRef | null }>({})

  const handleUserInput = useHandler((inputKey: keyof SepaInfo) => (inputValue: string) => {
    formData[inputKey] = inputValue
    setFormData({ ...formData })
  })

  const handleBlur = useHandler((key: string) => () => {
    const inputRef = inputRefs.current[key]

    if (inputRef != null) {
      inputRef.blur()
    }
  })

  const handleSubmit = useHandler(async () => {
    // Save user input to disk
    await setDiskletForm(disklet, SEPA_FORM_DISKLET_NAME, formData)

    onSubmit(formData)
  })

  // Initialize scene with any saved forms from disklet
  useAsyncEffect(async () => {
    const diskletFormData = await getDiskletFormData(disklet, SEPA_FORM_DISKLET_NAME, asSepaInfo)
    if (diskletFormData != null) {
      setFormData(diskletFormData)
    }
  }, [])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" extraScrollHeight={theme.rem(2.75)} enableAutomaticScroll enableOnAndroid>
        <SceneHeader title={headerTitle} underline withTopMargin />
        <EdgeText style={styles.formSectionTitle}>{s.strings.bank_info}</EdgeText>
        {(Object.keys(SEPA_FORM_TITLE_MAP) as Array<keyof SepaInfo>).map(key => {
          return (
            <View key={key}>
              <OutlinedTextInput
                returnKeyType="next"
                label={SEPA_FORM_TITLE_MAP[key]}
                onChangeText={handleUserInput(key)}
                value={formData != null ? formData[key] ?? '' : ''}
                autoFocus={key === 'name'}
                onBlur={handleBlur(key)}
                ref={input => (inputRefs.current[key] = input)}
              />
            </View>
          )
        })}
        <MainButton
          label={s.strings.string_next_capitalized}
          marginRem={[1, 0.5, 1, 0.5]}
          type="secondary"
          disabled={(Object.keys(formData) as Array<keyof SepaInfo>).some(key => formData[key].trim() === '')}
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
