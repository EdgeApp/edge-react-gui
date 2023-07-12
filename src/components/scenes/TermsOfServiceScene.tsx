import * as React from 'react'
import { WebView } from 'react-native-webview'

import { config } from '../../theme/appConfig'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props extends EdgeSceneProps<'termsOfService'> {}

export class TermsOfServiceComponent extends React.Component<Props> {
  render() {
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <WebView source={{ uri: config.termsOfServiceSite }} />
      </SceneWrapper>
    )
  }
}
