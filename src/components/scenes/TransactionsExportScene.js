// @flow

import type { EdgeCurrencyWallet, EdgeGetTransactionsOptions } from 'edge-core-js'
import * as React from 'react'
import { Platform, ScrollView } from 'react-native'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { exportTransactionsToCSV, exportTransactionsToQBO } from '../../actions/TransactionExportActions.js'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { DateModal } from '../modals/DateModal.js'
import { Airship, showActivity, showError } from '../services/AirshipInstance.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { PrimaryButton } from '../themed/PrimaryButton.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../themed/SettingsLabelRow.js'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'
import { SettingsRow } from '../themed/SettingsRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'

type File = {
  contents: string,
  mimeType: string, // 'text/csv'
  fileName: string // wallet-btc-2020.csv
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
    let lastYear = 0
    if (lastMonth.getMonth() === 11) lastYear = 1 // Decrease year by 1 if previous month was December
    this.state = {
      startDate: new Date(new Date().getFullYear() - lastYear, lastMonth.getMonth(), 1, 0, 0, 0),
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
    let lastYear = 0
    if (lastMonth.getMonth() === 11) lastYear = 1 // Decrease year by 1 if previous month was December
    this.setState({
      startDate: new Date(new Date().getFullYear() - lastYear, lastMonth.getMonth(), 1, 0, 0, 0),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0)
    })
  }

  render() {
    const { startDate, endDate, isExportCsv, isExportQbo } = this.state
    const { theme } = this.props
    const iconSize = theme.rem(1.25)

    const walletName = `${this.props.sourceWallet.name || s.strings.string_no_wallet_name} (${this.props.currencyCode})`
    const startDateString = formatDate(startDate)
    const endDateString = formatDate(endDate)
    const disabledExport = !isExportQbo && !isExportCsv

    return (
      <SceneWrapper background="theme">
        <ScrollView>
          <SettingsRow text={walletName} onPress={() => undefined} />
          <SettingsHeaderRow icon={<EntypoIcon name="calendar" color={theme.icon} size={iconSize} />} text={s.strings.export_transaction_date_range} />
          <SettingsRow text={s.strings.export_transaction_this_month} onPress={this.setThisMonth} />
          <SettingsRow text={s.strings.export_transaction_last_month} onPress={this.setLastMonth} />
          <SettingsLabelRow text={s.strings.string_start} right={startDateString} onPress={this.handleStartDate} />
          <SettingsLabelRow text={s.strings.string_end} right={endDateString} onPress={this.handleEndDate} />
          <SettingsHeaderRow icon={<EntypoIcon name="export" color={theme.icon} size={iconSize} />} text={s.strings.export_transaction_export_type} />
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

  handleSubmit = (): void => {
    const { startDate, endDate } = this.state
    if (startDate.getTime() > endDate.getTime()) {
      showError(s.strings.export_transaction_error)
      return
    }
    this.exportFiles().catch(showError)
  }

  pickFileName() {
    const { sourceWallet, currencyCode } = this.props
    const now = new Date()

    const walletName = sourceWallet.name != null ? sourceWallet.name : s.strings.string_no_wallet_name

    const fullCurrencyCode =
      sourceWallet.currencyInfo.currencyCode === currencyCode ? currencyCode : `${sourceWallet.currencyInfo.currencyCode}-${currencyCode}`

    const dateString =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString() +
      now.getDate().toString() +
      now.getHours().toString() +
      now.getMinutes().toString() +
      now.getSeconds().toString()

    const fileName = `${walletName}-${fullCurrencyCode}-${dateString}`
    return fileName
      .replace(/[^\w\s-]/g, '') // Delete weird characters
      .trim()
      .replace(/[-\s]+/g, '-') // Collapse spaces & dashes
  }

  async exportFiles(): Promise<void> {
    const { isExportQbo, isExportCsv, startDate, endDate } = this.state
    const { sourceWallet, currencyCode, multiplier } = this.props
    const transactionOptions: EdgeGetTransactionsOptions = {
      denomination: multiplier,
      currencyCode,
      startDate,
      endDate
    }

    const fileName = this.pickFileName()
    const files: File[] = []
    const formats: string[] = []

    // The non-string result appears to be a bug in the core,
    // which we are relying on to determine if the date range is empty:
    const csvFile = await showActivity(s.strings.export_transaction_loading, exportTransactionsToCSV(this.props.sourceWallet, transactionOptions))
    if (typeof csvFile !== 'string' || csvFile === '' || csvFile == null) {
      showError(s.strings.export_transaction_export_error)
      return
    }

    if (isExportCsv) {
      files.push({
        contents: csvFile,
        mimeType: 'text/comma-separated-values',
        fileName: fileName + '.csv'
      })
      formats.push('CSV')
    }

    if (isExportQbo) {
      const qboFile = await showActivity(s.strings.export_transaction_loading, exportTransactionsToQBO(sourceWallet, transactionOptions))
      files.push({
        contents: qboFile,
        mimeType: 'application/vnd.intu.qbo',
        fileName: fileName + '.qbo'
      })
      formats.push('QBO')
    }

    const title = 'Share Transactions ' + formats.join(', ')
    if (Platform.OS === 'android') {
      await this.shareAndroid(title, files[0])
    } else {
      await this.shareIos(title, files)
    }
  }

  async shareAndroid(title: string, file: File): Promise<void> {
    try {
      const directory = RNFS.ExternalCachesDirectoryPath
      const url = `file://${directory}/${file.fileName}`
      await RNFS.writeFile(`${directory}/${file.fileName}`, file.contents, 'utf8')

      await Share.open({
        title,
        message: '',
        url,
        filename: file.fileName,
        subject: title
      }).catch(error => {
        console.log('Share error', error)
        showError(error)
      })
    } catch (error) {
      console.log('Error writing file to disk', error)
      showError(error)
    }
  }

  async shareIos(title: string, files: File[]): Promise<void> {
    const directory = RNFS.DocumentDirectoryPath
    const urls: string[] = []
    for (const file of files) {
      const url = `file://${directory}/${file.fileName}`
      urls.push(url)
      await RNFS.writeFile(`${directory}/${file.fileName}`, file.contents, 'utf8')
    }

    await Share.open({
      title,
      urls,
      subject: title
    }).catch(error => console.log(error))
  }
}

export const TransactionsExportScene = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => ({
    multiplier: getDisplayDenomination(state, ownProps.currencyCode).multiplier
  }),
  dispatch => ({})
)(withTheme(TransactionsExportSceneComponent))
