import * as React from 'react'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { SceneContainer } from '../../../components/layout/SceneContainer'
import { Paragraph } from '../../../components/themed/EdgeText'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../../types/routerTypes'
import { getDiskletFormData, setDiskletForm } from '../../../util/formUtils'
import { ENV } from '../../../env'
import { useGiftCardProvider } from '../../../hooks/useGiftCardProvider'
import {
  asPhazeUser,
  PHAZE_IDENTITY_DISKLET_NAME
} from '../../gift-cards/phazeGiftCardTypes'
import { GuiFormField } from '../../gui/components/GuiFormField'

interface Props extends EdgeAppSceneProps<'giftCardIdentityForm'> {}

const isValidEmail = (email: string): boolean => {
  if (email.trim() === '') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const GiftCardIdentityFormScene: React.FC<Props> = props => {
  const { navigation } = props
  const disklet = useSelector(state => state.core.disklet)
  const account = useSelector(state => state.core.account)

  const [email, setEmail] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [emailError, setEmailError] = React.useState('')

  // Gift cards provider
  const apiKey = (ENV.PLUGIN_API_KEYS as any)?.phaze?.apiKey ?? ''
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey
  })

  const handleEmailChange = useHandler((text: string) => {
    setEmail(text)
    if (emailError !== '') setEmailError('')
  })

  const handleCancelPress = useHandler(() => {
    if (navigation.canGoBack()) navigation.goBack()
  })

  const handleSubmitPress = useHandler(async () => {
    if (!isValidEmail(email)) {
      setEmailError(lstrings.invalid_email)
      return
    }
    if (!isReady || provider == null) return

    // Register with partner and persist returned identity/api key
    const response = await provider.registerUser({
      email,
      firstName,
      lastName
    })
    const data = response.data

    await setDiskletForm(disklet, PHAZE_IDENTITY_DISKLET_NAME, {
      email: data.email ?? email,
      firstName: data.firstName ?? firstName,
      lastName: data.lastName ?? lastName,
      userApiKey: data.userApiKey,
      id: data.id,
      balance: data.balance,
      balanceCurrency: data.balanceCurrency
    })
    if (data.userApiKey != null) provider.setUserApiKey(data.userApiKey)

    navigation.navigate('giftCardMarket')
  })

  useAsyncEffect(
    async () => {
      const saved = await getDiskletFormData(
        disklet,
        PHAZE_IDENTITY_DISKLET_NAME,
        asPhazeUser
      )
      if (saved != null) {
        setEmail(saved.email)
        setFirstName(saved.firstName)
        setLastName(saved.lastName)
      }
    },
    [],
    'GiftCardIdentityFormScene'
  )

  return (
    <SceneWrapper hasTabs hasNotifications avoidKeyboard scroll>
      <SceneContainer headerTitle={lstrings.enter_contact_info}>
        <Paragraph>{lstrings.enter_contact_info}</Paragraph>
        <GuiFormField
          fieldType="text"
          autofocus
          label={lstrings.form_field_title_first_name}
          onChangeText={setFirstName}
          value={firstName}
        />
        <GuiFormField
          fieldType="text"
          label={lstrings.form_field_title_last_name}
          onChangeText={setLastName}
          value={lastName}
        />
        <GuiFormField
          fieldType="text"
          label={lstrings.form_field_title_email_address}
          onChangeText={handleEmailChange}
          value={email}
          error={emailError}
        />
        <SceneButtons
          primary={{
            label: lstrings.submit,
            disabled: email === '' || firstName === '' || lastName === '',
            onPress: handleSubmitPress
          }}
          secondary={{
            label: lstrings.string_cancel_cap,
            onPress: handleCancelPress
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}
