import { ChangePinScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { EdgeText } from '../themed/EdgeText'

interface Props extends EdgeSceneProps<'changePin'> {}

export const ChangePinScene = (props: Props) => {
  return (
    <SceneWrapper>
      <EdgeText>TEST</EdgeText>
      <ChangePinScreen />
    </SceneWrapper>
  )
}
