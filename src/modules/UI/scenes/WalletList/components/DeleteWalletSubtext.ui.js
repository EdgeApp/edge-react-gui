import React, {Component} from 'react'
import T from '../../../components/FormattedText/FormattedText.ui'
import styles from '../style'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'

const DELETE_WALLET_CONFIRMATION_TEXT = sprintf(strings.enUS['fragmet_wallets_delete_wallet_first_confirm_message_mobile'])
const THIS_WALLET_TEXT = sprintf(strings.enUS['fragment_wallets_this_wallet'])

export default class DeleteSubtext extends Component {
  render () {
    return (
      <T style={styles.subHeaderSyntax}>
        {DELETE_WALLET_CONFIRMATION_TEXT}
        {(this.props.currentWalletBeingDeleted)
          ? <T style={{fontWeight: 'bold'}}>
            {this.props.currentWalletBeingDeleted}?
          </T>
          : <T>{THIS_WALLET_TEXT}</T>}
      </T>
    )
  }
}
