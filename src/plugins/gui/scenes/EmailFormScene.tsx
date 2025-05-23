import * as React from 'react'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { SceneContainer } from '../../../components/layout/SceneContainer'
import { Paragraph } from '../../../components/themed/EdgeText'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { BuyTabSceneProps } from '../../../types/routerTypes'
import { GuiFormField } from '../components/GuiFormField'

export interface FiatPluginEmailFormParams {
  message?: string
  onClose: () => void
  onSubmit: (email: string) => Promise<void>
}

interface Props extends BuyTabSceneProps<'guiPluginEmailForm'> {}

export const EmailFormScene = React.memo((props: Props) => {
  const { navigation, route } = props
  const { params } = route
  const { onClose, onSubmit } = params

  const [email, setEmail] = React.useState('')

  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      onClose()
    })
  }, [navigation, onClose])

  const handleCancelPress = useHandler(() => {
    if (navigation.canGoBack()) navigation.goBack()
  })
  const handleSubmitPress = useHandler(async () => {
    await onSubmit(email)
  })

  return (
    <SceneWrapper hasTabs hasNotifications avoidKeyboard scroll>
      <SceneContainer headerTitle={lstrings.enter_email}>
        {params.message == null ? null : <Paragraph>{params.message}</Paragraph>}
        <GuiFormField fieldType="text" autofocus label={lstrings.form_field_title_email_address} onChangeText={setEmail} value={email} />
        <SceneButtons
          primary={{
            label: lstrings.submit,
            disabled: email === '',
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
})
