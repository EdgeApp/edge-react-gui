import * as React from 'react'
import { WebView } from 'react-native-webview'

import { config } from '../../theme/appConfig'
import { SceneWrapper } from '../common/SceneWrapper'

interface Props {}

export class TermsOfServiceComponent extends React.Component<Props> {
  render() {
    return (
      <SceneWrapper background="body" hasTabs={false}>
        <WebView source={{ uri: config.termsOfServiceSite }} />
      </SceneWrapper>
    )
  }
}
