import type { EdgeCurrencyWallet, EdgeGetTransactionsOptions } from 'edge-core-js'
// @flow
import React, { Component } from 'react'
import { View } from 'react-native'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'

import s from '../../../../locales/strings'
import { TransactionExportSceneStyle } from '../../../../styles/indexStyles'
import { PrimaryButton } from '../../components/Buttons/index'
import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView/index.js'

type PassedProps = {
  sourceWallet: EdgeCurrencyWallet
}
type Props = PassedProps

export class TransactionsExportSceneComponent extends Component<Props> {
  render () {
    const styles = TransactionExportSceneStyle
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Gradient style={styles.gradient} />
          <View style={styles.shim} />
          <View style={styles.actionButtonContainer}>
            <PrimaryButton text={s.strings.string_export_qbo} onPressFunction={this.exportQBO} />
          </View>
          <View style={styles.shim} />
          <View style={styles.actionButtonContainer}>
            <PrimaryButton text={s.strings.string_export_csv} onPressFunction={this.exportCSV} />
          </View>
        </View>
      </SafeAreaView>
    )
  }
  exportQBO = async () => {
    const transactionOptions: EdgeGetTransactionsOptions = {}
    const file = await this.props.sourceWallet.exportTransactionsToQBO(transactionOptions)
    const path = RNFS.DocumentDirectoryPath + '/My Wallet.QBO'
    RNFS.writeFile(path, file, 'utf8')
      .then(success => {
        console.log('FS: FILE WRITTEN!')
        this.openShareApp(path, 'Share Transactions QBO')
      })
      .catch(err => {
        console.log('FS: ', err.message)
      })
  }
  exportCSV = async () => {
    const transactionOptions: EdgeGetTransactionsOptions = {}
    const file = await this.props.sourceWallet.exportTransactionsToCSV(transactionOptions)
    const path = RNFS.DocumentDirectoryPath + '/My Wallet.csv'
    RNFS.writeFile(path, file, 'utf8')
      .then(success => {
        console.log('FS: FILE WRITTEN!')
        this.openShareApp(path, 'Share Transactions CSV')
      })
      .catch(err => {
        console.log('FS: ', err.message)
      })
  }

  openShareApp = (path: string, subject: string) => {
    const shareOptions = {
      title: subject,
      message: '',
      url: 'file://' + path,
      subject: subject //  for email
    }
    Share.open(shareOptions)
      .then(() => {
        console.log('FS: Success')
      })
      .catch(err => {
        console.log('FS:error on Share  ', err.message)
        console.log('FS:error on Share  ', err)
      })
  }
}
