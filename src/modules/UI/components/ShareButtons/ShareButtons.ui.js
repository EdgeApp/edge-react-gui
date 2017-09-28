import React, {Component} from 'react'
import {View, StyleSheet} from 'react-native'
import ShareButton from '../ShareButton/index.js'
import THEME from '../../../../theme/variables/airbitz.js'
import strings from '../../../../locales/default.js'

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.BLUE_ALPHA_BUTTON.UNPRESSED
  },
  border: {
    borderColor: 'rgba(256, 256, 256, 0.5)',
    borderRightWidth: 1,
  }
})

export default class ShareButtons extends Component {
  render () {
    const {copyToClipboard,
    // shareViaEmail,
    // shareViaSMS,
    shareViaShare} = this.props

    return <View
      style={[styles.view]}>
      <ShareButton
        displayName={strings.enUS['fragment_request_copy_title']}
        border={styles.border}
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
        displayName={strings.enUS['string_share']}
        onPress={shareViaShare}
        />
    </View>
  }
}
