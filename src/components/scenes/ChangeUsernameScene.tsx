import { ChangeUsernameScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeAppSceneProps<'changeUsername'> {}

export const ChangeUsernameScene = (props: Props) => {
  const { navigation, route } = props
  const { password } = route.params
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)

  const handleComplete = useHandler(() => {
    navigation.goBack()
  })

  const handleLogEvent = useHandler((event, values) => {
    dispatch(logEvent(event, values))
  })

  return (
    <SceneWrapper>
      <ChangeUsernameScreen
        account={account}
        context={context}
        password={password}
        onComplete={handleComplete}
        onLogEvent={handleLogEvent}
      />
    </SceneWrapper>
  )
}
