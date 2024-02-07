import { OtpError } from 'edge-core-js'
import { OtpRepairScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'

export interface OtpRepairParams {
  otpError: OtpError
}

interface Props extends EdgeSceneProps<'otpRepair'> {}

export const OtpRepairScene = (props: Props) => {
  const { navigation, route } = props
  const { otpError } = route.params
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)

  const handleComplete = useHandler(() => navigation.goBack())

  return (
    <SceneWrapper>
      <OtpRepairScreen
        account={account}
        branding={{ appName: config.appName }}
        context={context}
        onComplete={handleComplete}
        otpError={otpError}
        onLogEvent={logEvent}
      />
    </SceneWrapper>
  )
}
