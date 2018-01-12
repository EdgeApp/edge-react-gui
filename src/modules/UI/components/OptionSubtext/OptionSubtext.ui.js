// @flow
import React, {Component} from 'react'
import T from '../FormattedText/FormattedText.ui'
import styles from './style.js'
import s from '../../../../locales/strings.js'
import {sprintf} from 'sprintf-js'

type Props = {
  confirmationText: string,
  label: string
}

type State = {}

export default class OptionSubtext extends Component<Props, State> {
  render () {
    const WALLET_CONFIRMATION_TEXT = sprintf(this.props.confirmationText)
    const THIS_WALLET_TEXT = sprintf(s.strings.fragment_wallets_this_wallet)

    return (
      <T style={styles.subHeaderSyntax}>
        {WALLET_CONFIRMATION_TEXT}
        {(this.props.currentWallet)
          ? <T style={{fontWeight: 'bold'}}>
            {this.props.currentWallet}?
          </T>
          : <T>{THIS_WALLET_TEXT}</T>}
      </T>
    )
  }
}
