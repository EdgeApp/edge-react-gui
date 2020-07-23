// @flow

import DateTimePicker from '@react-native-community/datetimepicker'
import type { EdgeCurrencyWallet, EdgeGetTransactionsOptions } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import RNFS from 'react-native-fs'
import Mailer from 'react-native-mail'
import Share from 'react-native-share'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Entypo from 'react-native-vector-icons/Entypo'

import { formatExpDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { sanitizeForFilename } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../common/SettingsLabelRow.js'
import { SettingsRow } from '../common/SettingsRow.js'
import { SettingsSwitchRow } from '../common/SettingsSwitchRow.js'
import { showActivity, showError } from '../services/AirshipInstance.js'

const rightArrow = <AntDesign name="right" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} />

type Files = {
  qbo?: {
    file: string,
    format: string,
    path: string,
    fileName: string
  },
  csv?: {
    file: string,
    format: string,
    path: string,
    fileName: string
  }
}

export type PassedProps = {
  sourceWallet: EdgeCurrencyWallet,
  currencyCode: string
}

type StateProps = {
  denomination: string
}

type Props = StateProps & PassedProps

type State = {
  startDate: Date,
  endDate: Date,
  datePicker: 'startDate' | 'endDate' | null,
  isExportQbo: boolean,
  isExportCsv: boolean
}

export class TransactionsExportSceneComponent extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    this.state = {
      startDate: new Date(new Date().getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0),
      datePicker: null,
      isExportQbo: false,
      isExportCsv: true
    }
  }

  toggleExportAndroid() {
    this.setState({
      isExportCsv: !this.state.isExportCsv,
      isExportQbo: !this.state.isExportQbo
    })
  }

  toggleExportQbo = () => {
    if (Platform.OS === 'ios') {
      this.setState({ isExportQbo: !this.state.isExportQbo })
      return
    }
    this.toggleExportAndroid()
  }

  toggleExportCsv = () => {
    if (Platform.OS === 'ios') {
      this.setState({ isExportCsv: !this.state.isExportCsv })
      return
    }
    this.toggleExportAndroid()
  }

  setThisMonth = () => {
    this.setState({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0),
      endDate: new Date()
    })
  }

  setLastMonth = () => {
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    this.setState({
      startDate: new Date(new Date().getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0)
    })
  }

  exportFile = async () => {
    const { startDate, endDate, isExportQbo, isExportCsv } = this.state
    if (startDate.getTime() > endDate.getTime()) {
      return showError(s.strings.export_transaction_error)
    }
    if (Platform.OS === 'android' && isExportQbo && isExportCsv) {
      showError(s.strings.export_transaction_export_error_2)
      return
    }
    this.exportFiles()
    this.closeDatePicker()
  }

  showStartDatePicker = () => this.setState({ datePicker: 'startDate' })

  showEndDatePicker = () => this.setState({ datePicker: 'endDate' })

  onChangeDatePicker = (event: any, date: Date) => {
    if (this.state.datePicker === 'startDate') {
      this.setState({ startDate: date })
    }
    if (this.state.datePicker === 'endDate') {
      this.setState({ endDate: date })
    }
  }

  closeDatePicker = () => this.setState({ datePicker: null })

  render() {
    const { startDate, endDate, datePicker, isExportCsv, isExportQbo } = this.state
    const walletName = `${this.props.sourceWallet.name || s.strings.string_no_wallet_name} (${this.props.currencyCode})`
    const startDateString = formatExpDate(startDate)
    const endDateString = formatExpDate(endDate)
    const disabledExport = !isExportQbo && !isExportCsv
    return (
      <SceneWrapper background="body">
        <ScrollView>
          <TouchableWithoutFeedback onPress={this.closeDatePicker}>
            <View>
              <SettingsRow text={walletName} onPress={this.closeDatePicker} />
              <SettingsHeaderRow icon={<Entypo name="calendar" color={THEME.COLORS.WHITE} size={iconSize} />} text={s.strings.export_transaction_date_range} />
              <SettingsRow text={s.strings.export_transaction_this_month} right={rightArrow} onPress={this.setThisMonth} />
              <SettingsRow text={s.strings.export_transaction_last_month} right={rightArrow} onPress={this.setLastMonth} />
              <SettingsLabelRow text={s.strings.string_start} right={startDateString} onPress={this.showStartDatePicker} />
              <SettingsLabelRow text={s.strings.string_end} right={endDateString} onPress={this.showEndDatePicker} />
              <SettingsHeaderRow icon={<Entypo name="export" color={THEME.COLORS.WHITE} size={iconSize} />} text={s.strings.export_transaction_export_type} />
              <SettingsSwitchRow key="exportQbo" text={s.strings.export_transaction_quickbooks_qbo} value={isExportQbo} onPress={this.toggleExportQbo} />
              <SettingsSwitchRow key="exportCsv" text={s.strings.export_transaction_csv} value={isExportCsv} onPress={this.toggleExportCsv} />
              {!disabledExport && (
                <View style={styles.bottomArea}>
                  <PrimaryButton onPress={this.exportFile} disabled={disabledExport}>
                    <PrimaryButton.Text>{s.strings.string_export}</PrimaryButton.Text>
                  </PrimaryButton>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
        {datePicker !== null && (
          <View>
            {Platform.OS === 'ios' && (
              <TouchableWithoutFeedback onPress={() => this.setState({ datePicker: null })}>
                <View style={styles.accessoryView}>
                  <Text style={styles.accessoryText}>Done</Text>
                </View>
              </TouchableWithoutFeedback>
            )}
            <DateTimePicker testID="datePicker" value={datePicker === 'startDate' ? startDate : endDate} mode="date" onChange={this.onChangeDatePicker} />
          </View>
        )}
      </SceneWrapper>
    )
  }

  filenameDateString = () => {
    const date = new Date()
    const fileNameAppend =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString() +
      date.getDate().toString() +
      date.getHours().toString() +
      date.getMinutes().toString() +
      date.getSeconds().toString()

    return fileNameAppend
  }

  fileName = (format: string) => {
    const { sourceWallet, currencyCode } = this.props
    const fullCurrencyCode =
      sourceWallet.currencyInfo.currencyCode === currencyCode ? currencyCode : `${sourceWallet.currencyInfo.currencyCode}-${currencyCode}`
    const walletName = sourceWallet.name ? `${sourceWallet.name}-${fullCurrencyCode}-` : `${s.strings.string_no_wallet_name}-${fullCurrencyCode}-`
    return sanitizeForFilename(walletName) + this.filenameDateString() + '.' + format.toLowerCase()
  }

  filePath = (format: string) => {
    const directory = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalDirectoryPath
    return directory + '/' + this.fileName(format)
  }

  exportFiles = async () => {
    const { isExportQbo, isExportCsv } = this.state
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: this.props.denomination,
      currencyCode: this.props.currencyCode,
      startDate: this.state.startDate,
      endDate: this.state.endDate
    }

    const files = {}

    // Error check when no transactions on a given date range
    const csvFile = await showActivity(s.strings.export_transaction_loading, this.props.sourceWallet.exportTransactionsToCSV(transactionOptions))
    if (typeof csvFile !== 'string') {
      showError(s.strings.export_transaction_export_error)
      return
    }

    if (isExportCsv) {
      const format = 'CSV'
      files.csv = {
        file: csvFile,
        format,
        path: this.filePath(format),
        fileName: this.fileName(format)
      }
    }

    if (isExportQbo) {
      const format = 'QBO'
      files.qbo = {
        file: await showActivity(s.strings.export_transaction_loading, this.props.sourceWallet.exportTransactionsToQBO(transactionOptions)),
        format,
        path: this.filePath(format),
        fileName: this.fileName(format)
      }
    }

    this.write(files)
  }

  write = async (files: Files) => {
    if (!files.qbo && !files.csv) return
    const paths = []
    let subject = null
    try {
      if (files.qbo) {
        const { file, format, path } = files.qbo
        paths.push(path)
        subject = `Share Transactions ${format}`
        await RNFS.writeFile(path, file, 'utf8')
      }

      if (files.csv) {
        const { file, format, path } = files.csv
        subject = subject ? `${subject}, ${format}` : `Share Transactions ${format}`
        paths.push(path)
        await RNFS.writeFile(path, file, 'utf8')
      }

      if (Platform.OS === 'ios') {
        this.openShareApp(paths, subject || '')
        return
      }

      const androidExport = this.state.isExportQbo ? files.qbo : files.csv
      if (androidExport) {
        this.openMailApp(androidExport.path, `Share Transactions ${androidExport.format}`, androidExport.format.toLowerCase())
        return
      } else {
        throw new Error(s.strings.export_transaction_export_error_3)
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  openShareApp = (paths: string[], subject: string) => {
    const shareOptions = {
      title: subject,
      message: '',
      urls: paths.map(path => 'file://' + path),
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

  openMailApp = (path: string, subject: string, fileType: string) => {
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
        attachment
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

const iconSize = THEME.rem(1.25)

const rawStyles = {
  bottomArea: {
    padding: THEME.rem(1.5)
  },
  accessoryView: {
    paddingVertical: THEME.rem(0.5),
    paddingHorizontal: THEME.rem(1),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.WHITE
  },
  accessoryBtn: {
    paddingVertical: THEME.rem(0.5),
    paddingHorizontal: THEME.rem(1)
  },
  accessoryText: {
    color: THEME.COLORS.ACCENT_BLUE,
    fontSize: THEME.rem(1)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
