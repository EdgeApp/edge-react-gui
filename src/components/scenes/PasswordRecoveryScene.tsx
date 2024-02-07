import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeSceneProps<'passwordRecovery'> {}

export const ChangeRecoveryScene = (props: Props) => {
  const { navigation } = props
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)

  const handleComplete = useHandler(() => navigation.goBack())

  return (
    <SceneWrapper>
      <PasswordRecoveryScreen
        branding={{ appName: config.appName }}
        account={account}
        context={context}
        onLogEvent={logEvent}
        onComplete={handleComplete}
        // @ts-expect-error
        onCancel={handleComplete}
        showHeader={false}
      />
    </SceneWrapper>
  )
}
