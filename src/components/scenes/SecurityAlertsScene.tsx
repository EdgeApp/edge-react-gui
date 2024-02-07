import { SecurityAlertsScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeSceneProps<'securityAlerts'> {}

export const SecurityAlertsScene = (props: Props) => {
  const { navigation } = props
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)

  const handleComplete = useHandler(() => navigation.pop())

  return (
    <SceneWrapper>
      <SecurityAlertsScreen account={account} context={context} onLogEvent={logEvent} onComplete={handleComplete} />
    </SceneWrapper>
  )
}
