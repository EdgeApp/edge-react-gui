import React, {Component} from 'react'
import T from '../../../components/FormattedText/FormattedText.ui'
import styles from '../style'
import s from '../../../../../locales/strings.js'
import {sprintf} from 'sprintf-js'

const RESYNC_WALLET_CONFIRMATION_TEXT = sprintf(s.strings.fragment_wallets_resync_wallet_first_confirm_message_mobile)
const THIS_WALLET_TEXT = sprintf(s.strings.fragment_wallets_this_wallet)

export default class ResyncSubtext extends Component {
  render () {
    return (
      <T style={styles.subHeaderSyntax}>
        {RESYNC_WALLET_CONFIRMATION_TEXT}
        {(this.props.currentWalletBeingResynced)
          ? <T style={{fontWeight: 'bold'}}>
            {this.props.currentWalletBeingResynced}?
          </T>
          : <T>{THIS_WALLET_TEXT}</T>}
      </T>
    )
  }
}
