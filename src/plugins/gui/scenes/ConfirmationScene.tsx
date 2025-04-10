import * as React from 'react'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { SceneContainer } from '../../../components/layout/SceneContainer'
import { Paragraph } from '../../../components/themed/EdgeText'
import { SceneHeaderUi4 } from '../../../components/themed/SceneHeaderUi4'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { BuyTabSceneProps } from '../../../types/routerTypes'

export interface FiatPluginConfirmationParams {
  message: string
  onClose: () => void
  title: string
}

interface Props extends BuyTabSceneProps<'guiPluginConfirmation'> {}

export const ConfirmationScene = React.memo((props: Props) => {
  const { route } = props

  const handleDonePress = useHandler(async () => {
    route.params.onClose()
  })

  return (
    <SceneWrapper hasTabs hasNotifications>
      <SceneContainer>
        <SceneHeaderUi4 title={route.params.title} />
        <Paragraph>{route.params.message}</Paragraph>
      </SceneContainer>
      <SceneButtons
        primary={{
          label: lstrings.string_done_cap,
          onPress: handleDonePress
        }}
      />
    </SceneWrapper>
  )
})
