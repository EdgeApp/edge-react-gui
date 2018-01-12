import React, {Component} from 'react'
import T from '../../../components/FormattedText/FormattedText.ui'
import styles from '../style'
import s from '../../../../../locales/strings.js'
import {sprintf} from 'sprintf-js'

const SPLIT_WALLET_CONFIRMATION_TEXT = sprintf(s.strings.fragment_wallets_split_wallet_first_confirm_message_mobile)
const THIS_WALLET_TEXT = sprintf(s.strings.fragment_wallets_this_wallet)

export default class SplitSubtext extends Component {
  render () {
    return (
      <T style={styles.subHeaderSyntax}>
        {SPLIT_WALLET_CONFIRMATION_TEXT}
        {(this.props.currentWalletBeingSplited)
          ? <T style={{fontWeight: 'bold'}}>
            {this.props.currentWalletBeingSplited}?
          </T>
          : <T>{THIS_WALLET_TEXT}</T>}
      </T>
    )
  }
}
