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

  filenameDateString = () => {
    const date = new Date()
    const fileNameAppend =
      date.getFullYear().toString() +
      date.getMonth().toString() +
      date.getDate().toString() +
      date.getHours().toString() +
      date.getMinutes().toString() +
      date.getSeconds().toString()

    return fileNameAppend
  }

  fileName = (format: string) => {
    const walletName = this.props.sourceWallet.name ? this.props.sourceWallet.name : 'MyWallet'
    return walletName + this.filenameDateString() + '.' + format.toLowerCase()
  }

  filePath = (format: string) => {
    const directory = Platform.OS === IOS ? RNFS.DocumentDirectoryPath : RNFS.ExternalDirectoryPath
    return directory + '/' + this.fileName(format)
  }

  exportQBO = async () => {
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: this.props.denomination
    }
    const file = await this.props.sourceWallet.exportTransactionsToQBO(transactionOptions)

    const format = 'QBO'

    this.write(file, format)
  }

  exportCSV = async () => {
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: this.props.denomination
    }
    const file = await this.props.sourceWallet.exportTransactionsToCSV(transactionOptions)

    const format = 'CSV'

    this.write(file, format)
  }

  write = (file: string, format: string) => {
    const path = this.filePath(format)

    const fileName = this.fileName(format)

    RNFS.writeFile(path, file, 'utf8')
      .then(success => {
        if (Platform.OS === IOS) {
          this.openShareApp(path, 'Share Transactions ' + format)
          return
        }
        this.openMailApp(path, 'Share Transactions ' + format, format, fileName)
      })
      .catch(err => {
        console.log('Error creating : ' + fileName, err.message)
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
