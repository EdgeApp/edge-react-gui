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

const rightArrow = <AntDesign name="right" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} />

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

  toggleExportQbo = () => this.setState({ isExportQbo: !this.state.isExportQbo })

  toggleExportCsv = () => this.setState({ isExportCsv: !this.state.isExportCsv })

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
    if (this.state.isExportQbo) {
      await this.exportQBO()
    }
    if (this.state.isExportCsv) {
      await this.exportCSV()
    }
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
    const walletName = this.props.sourceWallet.name ? this.props.sourceWallet.name : 'MyWallet'
    return sanitizeForFilename(walletName) + this.filenameDateString() + '.' + format.toLowerCase()
  }

  filePath = (format: string) => {
    const directory = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalDirectoryPath
    return directory + '/' + this.fileName(format)
  }

  exportQBO = async () => {
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: this.props.denomination,
      currencyCode: this.props.currencyCode
    }
    const file = await this.props.sourceWallet.exportTransactionsToQBO(transactionOptions)

    const format = 'QBO'

    this.write(file, format)
  }

  exportCSV = async () => {
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: this.props.denomination,
      currencyCode: this.props.currencyCode
    }
    let file = await this.props.sourceWallet.exportTransactionsToCSV(transactionOptions)
    if (typeof file !== 'string') file = ''
    const format = 'CSV'

    this.write(file, format)
  }

  write = (file: string, format: string) => {
    const path = this.filePath(format)

    const fileName = this.fileName(format)

    RNFS.writeFile(path, file, 'utf8')
      .then(success => {
        if (Platform.OS === 'ios') {
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
