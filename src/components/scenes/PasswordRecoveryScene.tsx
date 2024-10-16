import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeAppSceneProps<'passwordRecovery'> {}

export const ChangeRecoveryScene = (props: Props) => {
  const { navigation } = props
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const dispatch = useDispatch()

  const handleComplete = useHandler(() => navigation.goBack())

  const handleLogEvent = useHandler((event, values) => {
    dispatch(logEvent(event, values))
  })

  return (
    <SceneWrapper>
      <PasswordRecoveryScreen
        branding={{ appName: config.appName }}
        account={account}
        context={context}
        onLogEvent={handleLogEvent}
        onComplete={handleComplete}
      />
    </SceneWrapper>
  )
}
