import { UpgradeUsernameScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeSceneProps<'upgradeUsername'> {}

export const UpgradeUsernameScene = (props: Props) => {
  const { navigation } = props
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)

  const handleComplete = () => {
    if (account.username != null) logActivity(`Light account backed up as: ${account.username}`)
    navigation.goBack()
  }
  return (
    <SceneWrapper hasTabs={false} background="theme">
      <UpgradeUsernameScreen account={account} context={context} onComplete={handleComplete} />
    </SceneWrapper>
  )
}
