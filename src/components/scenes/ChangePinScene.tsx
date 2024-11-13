import { ChangePinScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeAppSceneProps<'changePin'> {}

export const ChangePinScene = (props: Props) => {
  const { navigation } = props
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const dispatch = useDispatch()

  const handleComplete = () => {
    logActivity(`PIN Changed: ${account.username}`)
    navigation.goBack()
  }

  const handleLogEvent = useHandler((event, values) => {
    dispatch(logEvent(event, values))
  })

  return (
    <SceneWrapper>
      <ChangePinScreen account={account} context={context} onComplete={handleComplete} onLogEvent={handleLogEvent} />
    </SceneWrapper>
  )
}
