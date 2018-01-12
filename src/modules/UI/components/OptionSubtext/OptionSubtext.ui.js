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
    return (
      <T style={styles.subHeaderSyntax}>
        {this.props.confirmationText}
        {(this.props.currentWallet)
          ? <T style={{fontWeight: 'bold'}}>
            {this.props.currentWallet}?
          </T>
          : <T>{s.strings.fragment_wallets_this_wallet}</T>}
      </T>
    )
  }
}
