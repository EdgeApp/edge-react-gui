/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { getDiskletFormData, setDiskletForm } from '../../../actions/FormActions'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { ADDRESS_FORM_DISKLET_NAME, asHomeAddress, HomeAddress } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { RouteProp } from '../../../types/routerTypes'
import { GuiFormField } from '../components/GuiFormField'

interface Props {
  route: RouteProp<'guiPluginAddressForm'>
}

export const AddressFormScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { countryCode, headerTitle, /* headerIconUri, */ onSubmit } = props.route.params
  const disklet = useSelector(state => state.core.disklet)
  const [formData, setFormData] = React.useState<HomeAddress>({
    address: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: countryCode
  })

  const handleChangeAddress = useHandler((inputValue: string) => {
    setFormData({ ...formData, address: inputValue })
  })

  const handleChangeAddress2 = useHandler((inputValue: string) => {
    setFormData({ ...formData, address2: inputValue })
  })

  const handleChangeCity = useHandler((inputValue: string) => {
    setFormData({ ...formData, city: inputValue })
  })

  const handleChangeState = useHandler((inputValue: string) => {
    setFormData({ ...formData, state: inputValue })
  })

  const handleChangePostalCode = useHandler((inputValue: string) => {
    setFormData({ ...formData, postalCode: inputValue })
  })

  const handleSubmit = useHandler(async () => {
    // Save user input to disk
    await setDiskletForm(disklet, ADDRESS_FORM_DISKLET_NAME, formData)

    await onSubmit(formData)
  })

  // Initialize scene with any saved form data from disklet
  useAsyncEffect(async () => {
    const diskletFormData = await getDiskletFormData(disklet, ADDRESS_FORM_DISKLET_NAME, asHomeAddress)
    if (diskletFormData != null && diskletFormData.country === countryCode) {
      setFormData(diskletFormData)
    }
    return () => {}
  }, [])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" extraScrollHeight={theme.rem(2.75)} enableAutomaticScroll enableOnAndroid>
        <SceneHeader title={headerTitle} underline withTopMargin />
        <EdgeText style={styles.formSectionTitle}>{s.strings.home_address_title}</EdgeText>
        <GuiFormField fieldType="address" autofocus label={s.strings.address_line_1} value={formData.address} onChangeText={handleChangeAddress} />
        <GuiFormField fieldType="address2" label={s.strings.address_line_2} value={formData.address2} onChangeText={handleChangeAddress2} />
        <GuiFormField fieldType="city" label={s.strings.address_city} value={formData.city} onChangeText={handleChangeCity} />
        <GuiFormField fieldType="state" label={s.strings.address_state_province_region} value={formData.state} onChangeText={handleChangeState} />
        <GuiFormField
          fieldType="postalcode"
          returnKeyType="done"
          label={s.strings.address_zip_postal_code}
          value={formData.postalCode}
          onChangeText={handleChangePostalCode}
        />
        <MainButton
          label={s.strings.string_next_capitalized}
          marginRem={[1, 0.5, 1, 0.5]}
          type="secondary"
          disabled={(Object.keys(formData) as Array<keyof HomeAddress>).some(
            key =>
              // Disable next on empty non-optional fields
              key !== 'address2' && formData[key].trim() === ''
          )}
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
