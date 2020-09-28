// @flow

import type { EdgeCurrencyWallet, EdgeGetTransactionsOptions } from 'edge-core-js'
import * as React from 'react'
import { Platform, ScrollView } from 'react-native'
import RNFS from 'react-native-fs'
import Mailer from 'react-native-mail'
import Share from 'react-native-share'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Entypo from 'react-native-vector-icons/Entypo'
import { connect } from 'react-redux'

import { formatExpDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../modules/Settings/selectors.js'
import type { State as StateType } from '../../types/reduxTypes.js'
import { sanitizeForFilename } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { DateModal } from '../modals/DateModal.js'
import { Airship, showActivity, showError } from '../services/AirshipInstance.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../themed/SettingsLabelRow.js'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'
import { SettingsRow } from '../themed/SettingsRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { PrimaryButton } from '../themed/ThemedButtons.js'

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

type OwnProps = {
  sourceWallet: EdgeCurrencyWallet,
  currencyCode: string
}

type StateProps = {
  multiplier: string
}

type Props = StateProps & OwnProps & ThemeProps

type State = {
  startDate: Date,
  endDate: Date,
  isExportQbo: boolean,
  isExportCsv: boolean
}

class TransactionsExportSceneComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    this.state = {
      startDate: new Date(new Date().getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0),
      isExportQbo: false,
      isExportCsv: true
    }
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

  handleSubmit = (): void => {
    const { startDate, endDate, isExportQbo, isExportCsv } = this.state
    if (startDate.getTime() > endDate.getTime()) {
      showError(s.strings.export_transaction_error)
      return
    }
    if (Platform.OS === 'android' && isExportQbo && isExportCsv) {
      showError(s.strings.export_transaction_export_error_2)
      return
    }
    this.exportFiles()
  }

  render() {
    const { startDate, endDate, isExportCsv, isExportQbo } = this.state
    const { theme } = this.props
    const iconSize = theme.rem(1.25)
    const rightArrow = <AntDesign name="right" color={theme.icon} size={theme.rem(1)} />

    const walletName = `${this.props.sourceWallet.name || s.strings.string_no_wallet_name} (${this.props.currencyCode})`
    const startDateString = formatExpDate(startDate)
    const endDateString = formatExpDate(endDate)
    const disabledExport = !isExportQbo && !isExportCsv

    return (
      <SceneWrapper background="theme">
        <ScrollView>
          <SettingsRow text={walletName} onPress={() => undefined} />
          <SettingsHeaderRow icon={<Entypo name="calendar" color={theme.icon} size={iconSize} />} text={s.strings.export_transaction_date_range} />
          <SettingsRow text={s.strings.export_transaction_this_month} right={rightArrow} onPress={this.setThisMonth} />
          <SettingsRow text={s.strings.export_transaction_last_month} right={rightArrow} onPress={this.setLastMonth} />
          <SettingsLabelRow text={s.strings.string_start} right={startDateString} onPress={this.handleStartDate} />
          <SettingsLabelRow text={s.strings.string_end} right={endDateString} onPress={this.handleEndDate} />
          <SettingsHeaderRow icon={<Entypo name="export" color={theme.icon} size={iconSize} />} text={s.strings.export_transaction_export_type} />
          {Platform.OS === 'android' ? this.renderAndroidSwitches() : this.renderIosSwitches()}
          {disabledExport ? null : <PrimaryButton label={s.strings.string_export} marginRem={1.5} onPress={this.handleSubmit} />}
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderAndroidSwitches(): React.Node {
    const { isExportCsv, isExportQbo } = this.state
    return (
      <>
        <SettingsRadioRow key="exportQbo" text={s.strings.export_transaction_quickbooks_qbo} value={isExportQbo} onPress={this.handleAndroidToggle} />
        <SettingsRadioRow key="exportCsv" text={s.strings.export_transaction_csv} value={isExportCsv} onPress={this.handleAndroidToggle} />
      </>
    )
  }

  renderIosSwitches(): React.Node {
    const { isExportCsv, isExportQbo } = this.state
    return (
      <>
        <SettingsSwitchRow key="exportQbo" text={s.strings.export_transaction_quickbooks_qbo} value={isExportQbo} onPress={this.handleQboToggle} />
        <SettingsSwitchRow key="exportCsv" text={s.strings.export_transaction_csv} value={isExportCsv} onPress={this.handleCsvToggle} />
      </>
    )
  }

  handleStartDate = () => {
    const { startDate } = this.state
    Airship.show(bridge => <DateModal bridge={bridge} initialValue={startDate} />).then(date => {
      this.setState({ startDate: date })
    })
  }

  handleEndDate = () => {
    const { endDate } = this.state
    Airship.show(bridge => <DateModal bridge={bridge} initialValue={endDate} />).then(date => {
      this.setState({ endDate: date })
    })
  }

  handleAndroidToggle = () => {
    this.setState(state => ({
      isExportCsv: !state.isExportCsv,
      isExportQbo: !state.isExportQbo
    }))
  }

  handleQboToggle = () => {
    this.setState(state => ({ isExportQbo: !state.isExportQbo }))
  }

  handleCsvToggle = () => {
    this.setState(state => ({ isExportCsv: !state.isExportCsv }))
  }

  filenameDateString() {
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
      denomination: this.props.multiplier,
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

export const TransactionsExportScene = connect((state: StateType, ownProps: OwnProps): StateProps => {
  const denominationObject = getDisplayDenomination(state, ownProps.currencyCode)
  return {
    multiplier: denominationObject.multiplier
  }
})(withTheme(TransactionsExportSceneComponent))
