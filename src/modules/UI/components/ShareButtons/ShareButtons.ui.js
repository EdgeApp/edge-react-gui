// @flow

import React, { PureComponent } from 'react'
import { View } from 'react-native'

import s from '../../../../locales/strings'
import ShareButton from '../ShareButton'
import styles from './styles.js'

const COPY_TEXT = s.strings.fragment_request_copy_title
const SHARE_TEXT = s.strings.string_share
const FIO_ADDRESS_TEXT = s.strings.fio_address_label

export type Props = {
  fioAddressModal: Function,
  copyToClipboard: Function,
  shareViaShare: Function
}
export class ShareButtons extends PureComponent<Props> {
  render () {
    const {
      copyToClipboard,
      // shareViaEmail,
      // shareViaSMS,
      shareViaShare,
      fioAddressModal
    } = this.props

    return (
      <View style={styles.view}>
        <ShareButton displayName={FIO_ADDRESS_TEXT} border={styles.borderRight} onPress={fioAddressModal} />
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
