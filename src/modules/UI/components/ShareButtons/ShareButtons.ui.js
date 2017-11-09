import React, {Component} from 'react'
import {
  View
} from 'react-native'
import ShareButton from '../ShareButton'
import strings from '../../../../locales/default.js'

import styles from './styles.js'

const COPY_TEXT = strings.enUS['fragment_request_copy_title']
const SHARE_TEXT = strings.enUS['string_share']

export default class ShareButtons extends Component {
  render () {
    const {copyToClipboard,
    // shareViaEmail,
    // shareViaSMS,
    shareViaShare} = this.props

    return <View style={styles.view}>
      <ShareButton
        displayName={COPY_TEXT}
        border={styles.borderRight}
        onPress={copyToClipboard} />
      {/*<ShareButton
        style={styles.border}
        displayName='Email'
        onPress={shareViaEmail} />
      <ShareButton
        style={styles.border}
        displayName='SMS'
        onPress={shareViaSMS} />*/}
      <ShareButton
        displayName={SHARE_TEXT}
        onPress={shareViaShare} />
    </View>
  }
}
