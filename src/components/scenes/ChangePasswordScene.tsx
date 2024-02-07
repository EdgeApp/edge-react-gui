import { ChangePasswordScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeSceneProps<'changePassword'> {}

export const ChangePasswordScene = (props: Props) => {
  const { navigation } = props
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)

  const handleComplete = useHandler(() => {
    logActivity(`Password Changed: ${account.username}`)
    navigation.goBack()
  })

  return (
    <SceneWrapper>
      <ChangePasswordScreen account={account} context={context} onComplete={handleComplete} onLogEvent={logEvent} />
    </SceneWrapper>
  )
}
