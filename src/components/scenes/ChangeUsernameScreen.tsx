import { ChangeUsernameScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeAppSceneProps<'changeUsername'> {}

export const ChangeUsernameScene = (props: Props) => {
  const { navigation, route } = props
  const { password } = route.params
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)

  const handleComplete = useHandler((result?: { username?: string | undefined }) => {
    if (result?.username == null) return

    account.changeUsername({ username: result.username, password }).catch(error => console.error(error))
    logActivity(`Username changed to: ${result.username}`)

    navigation.goBack()
  })

  const handleLogEvent = useHandler((event, values) => {
    dispatch(logEvent(event, values))
  })

  return (
    <SceneWrapper hasHeader={false}>
      <ChangeUsernameScreen account={account} context={context} onComplete={handleComplete} onLogEvent={handleLogEvent} />
    </SceneWrapper>
  )
}
