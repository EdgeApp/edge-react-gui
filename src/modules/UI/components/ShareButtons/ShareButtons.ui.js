// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import s from '../../../../locales/strings'
import ShareButton from '../ShareButton'
import styles from './styles.js'

const COPY_TEXT = s.strings.fragment_request_copy_title
const SHARE_TEXT = s.strings.string_share

export type Props = {
  copyToClipboard: Function,
  shareViaShare: Function
}
export class ShareButtons extends Component<Props> {
  render () {
    const {
      copyToClipboard,
      // shareViaEmail,
      // shareViaSMS,
      shareViaShare
    } = this.props

    return (
      <View style={styles.view}>
        <ShareButton displayName={COPY_TEXT} border={styles.borderRight} onPress={copyToClipboard} />
        {/* <ShareButton
        style={styles.border}
        displayName='Email'
        onPress={shareViaEmail} />
      <ShareButton
        style={styles.border}
        displayName='SMS'
        onPress={shareViaSMS} /> */}
        <ShareButton displayName={SHARE_TEXT} onPress={shareViaShare} />
      </View>
    )
  }
}

export default ShareButtons
