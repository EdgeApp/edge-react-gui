// @flow
import type { EdgeCurrencyWallet, EdgeGetTransactionsOptions } from 'edge-core-js'
import React, { Component } from 'react'
import { Platform, View } from 'react-native'
import RNFS from 'react-native-fs'
import Mailer from 'react-native-mail'
import Share from 'react-native-share'

import { IOS } from '../../constants/indexConstants'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index.js'
import { TransactionExportSceneStyle } from '../../styles/indexStyles'

export type PassedProps = {
  sourceWallet: EdgeCurrencyWallet
}
type StateProps = {
  denomination: string
}

type Props = StateProps & PassedProps

export class TransactionsExportSceneComponent extends Component<Props> {
  render () {
    const styles = TransactionExportSceneStyle
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Gradient style={styles.gradient} />
          <View style={styles.shim} />
          <View style={styles.actionButtonContainer}>
            <PrimaryButton onPress={this.exportQBO}>
              <PrimaryButton.Text>{s.strings.string_export_qbo}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
          <View style={styles.shim} />
          <View style={styles.actionButtonContainer}>
            <PrimaryButton onPress={this.exportCSV}>
              <PrimaryButton.Text>{s.strings.string_export_csv}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
        </View>
      </SafeAreaView>
    )
  }
  exportQBO = async () => {
    const date = new Date()
    const fileNameAppend =
      date.getFullYear().toString() +
      date.getMonth().toString() +
      date.getDate().toString() +
      date.getHours().toString() +
      date.getMinutes().toString() +
      date.getSeconds().toString()
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: this.props.denomination
    }
    const file = await this.props.sourceWallet.exportTransactionsToQBO(transactionOptions)
    const path =
      Platform.OS === IOS
        ? RNFS.DocumentDirectoryPath + '/MyWallet' + fileNameAppend + '.QBO'
        : RNFS.ExternalDirectoryPath + '/MyWallet' + fileNameAppend + '.QBO'
    RNFS.writeFile(path, file, 'utf8')
      .then(success => {
        if (Platform.OS === IOS) {
          this.openShareApp(path, 'Share Transactions QBO')
          return
        }
        this.openMailApp(path, 'Share Transactions QBO', 'QBO', 'MyWallet' + fileNameAppend + '.QBO')
      })
      .catch(err => {
        console.log('file creation erro: ', err.message)
      })
  }
  exportCSV = async () => {
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: this.props.denomination
    }
    const file = await this.props.sourceWallet.exportTransactionsToCSV(transactionOptions)
    const path = Platform.OS === IOS ? RNFS.DocumentDirectoryPath + '/MyWallet.csv' : RNFS.ExternalDirectoryPath + '/MyWallet.csv'
    RNFS.writeFile(path, file, 'utf8')
      .then(success => {
        if (Platform.OS === IOS) {
          this.openShareApp(path, 'Share Transactions CSV')
          return
        }
        this.openMailApp(path, 'Share Transactions CSV', 'csv', 'My Wallet.csv')
      })
      .catch(err => {
        console.log('file creation error: ', err.message)
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

  openMailApp = (path: string, subject: string, fileType: string, fileName: string) => {
    const attachment = {
      path: path, // The absolute path of the file from which to read data.
      type: fileType // Mime Type: jpg, png, doc, ppt, html, pdf
    }
    Mailer.mail(
      {
        subject: subject,
        recipients: [''],
        body: ' ',
        isHTML: true,
        attachment: attachment
      },
      (error, event) => {
        if (error) {
          console.log(error)
        }
        if (event === 'sent') {
          console.log('ss: This is sent')
        }
      }
    )
  }
}
