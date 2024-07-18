import { asBoolean, asObject, asString } from 'cleaners'
import { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { getTxActionDisplayInfo } from '../../actions/CategoriesActions'
import { exportTransactionsToBitwave, exportTransactionsToCSV, exportTransactionsToQBO, updateTxsFiat } from '../../actions/TransactionExportActions'
import { formatDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom, getExchangeDenomByCurrencyCode, selectDisplayDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { DateModal } from '../modals/DateModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { ThemeProps, withTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsLabelRow } from '../settings/SettingsLabelRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { SettingsRow } from '../settings/SettingsRow'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { MainButton } from '../themed/MainButton'

export interface TransactionsExportParams {
  sourceWallet: EdgeCurrencyWallet
  currencyCode: string
}

interface File {
  contents: string
  mimeType: string // 'text/csv'
  fileName: string // wallet-btc-2020.csv
}

interface OwnProps extends EdgeSceneProps<'transactionsExport'> {}

interface StateProps {
  account: EdgeAccount
  defaultIsoFiat: string
  exchangeMultiplier: string
  multiplier: string
  parentMultiplier: string
  tokenId: EdgeTokenId
}

interface DispatchProps {
  updateTxsFiatDispatch: (wallet: EdgeCurrencyWallet, currencyCode: string, txs: EdgeTransaction[]) => void
}

type Props = StateProps & OwnProps & ThemeProps & DispatchProps

interface State {
  startDate: Date
  endDate: Date
  isExportQbo: boolean
  isExportCsv: boolean
  isExportBitwave: boolean
}

const EXPORT_TX_INFO_FILE = 'exportTxInfo.json'

const asExportTxInfo = asObject({
  bitwaveAccountId: asString,
  isExportQbo: asBoolean,
  isExportCsv: asBoolean,
  isExportBitwave: asBoolean
})

const asExportTxInfoMap = asObject(asExportTxInfo)

type ExportTxInfoMap = ReturnType<typeof asExportTxInfoMap>
type ExportTxInfo = ReturnType<typeof asExportTxInfo>

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
      isExportCsv: true,
      isExportBitwave: false
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

  async componentDidMount(): Promise<void> {
    try {
      const { sourceWallet } = this.props.route.params
      const { tokenId } = this.props
      const { disklet } = sourceWallet
      const result = await disklet.getText(EXPORT_TX_INFO_FILE)
      const exportTxInfoMap = asExportTxInfoMap(JSON.parse(result))
      const tokenCurrencyCode = tokenId ?? sourceWallet.currencyInfo.currencyCode

      const { isExportBitwave, isExportCsv, isExportQbo } = exportTxInfoMap[tokenCurrencyCode]
      this.setState({
        isExportBitwave,
        isExportCsv,
        isExportQbo
      })
    } catch (e) {
      console.log(`Could not read ${EXPORT_TX_INFO_FILE} ${String(e)}. Failure is ok`)
    }
  }

  render() {
    const { startDate, endDate, isExportBitwave, isExportCsv, isExportQbo } = this.state
    const { theme, route } = this.props
    const { sourceWallet, currencyCode } = route.params
    const iconSize = theme.rem(1.25)

    const walletName = `${getWalletName(sourceWallet)} (${currencyCode})`
    const startDateString = formatDate(startDate)
    const endDateString = formatDate(endDate)
    const disabledExport = !isExportQbo && !isExportCsv && !isExportBitwave

    return (
      <SceneWrapper scroll>
        <SettingsRow label={walletName} onPress={() => undefined} />
        <SettingsHeaderRow icon={<EntypoIcon name="calendar" color={theme.icon} size={iconSize} />} label={lstrings.export_transaction_date_range} />
        <SettingsRow label={lstrings.export_transaction_this_month} onPress={this.setThisMonth} />
        <SettingsRow label={lstrings.export_transaction_last_month} onPress={this.setLastMonth} />
        <SettingsLabelRow label={lstrings.string_start} right={startDateString} onPress={this.handleStartDate} />
        <SettingsLabelRow label={lstrings.string_end} right={endDateString} onPress={this.handleEndDate} />
        <SettingsHeaderRow icon={<EntypoIcon name="export" color={theme.icon} size={iconSize} />} label={lstrings.export_transaction_export_type} />
        {Platform.OS === 'android' ? this.renderAndroidSwitches() : this.renderIosSwitches()}
        {disabledExport ? null : <MainButton label={lstrings.string_export} marginRem={[3, 0, 1]} onPress={this.handleSubmit} type="secondary" />}
      </SceneWrapper>
    )
  }

  renderAndroidSwitches() {
    const { isExportBitwave, isExportCsv, isExportQbo } = this.state
    return (
      <>
        <SettingsRadioRow label={lstrings.export_transaction_quickbooks_qbo} value={isExportQbo} onPress={this.handleQboToggle} />
        <SettingsRadioRow label={lstrings.export_transaction_csv} value={isExportCsv} onPress={this.handleCsvToggle} />
        <SettingsRadioRow label={lstrings.export_transaction_bitwave_csv} value={isExportBitwave} onPress={this.handleBitwaveToggle} />
      </>
    )
  }

  renderIosSwitches() {
    const { isExportBitwave, isExportCsv, isExportQbo } = this.state
    return (
      <>
        <SettingsSwitchRow label={lstrings.export_transaction_quickbooks_qbo} value={isExportQbo} onPress={this.handleQboToggle} />
        <SettingsSwitchRow label={lstrings.export_transaction_csv} value={isExportCsv} onPress={this.handleCsvToggle} />
        <SettingsSwitchRow label={lstrings.export_transaction_bitwave_csv} value={isExportBitwave} onPress={this.handleBitwaveToggle} />
      </>
    )
  }

  handleStartDate = async () => {
    const { startDate } = this.state
    const date = await Airship.show<Date>(bridge => <DateModal bridge={bridge} initialValue={startDate} />)
    this.setState({ startDate: date })
  }

  handleEndDate = async () => {
    const { endDate } = this.state
    const date = await Airship.show<Date>(bridge => <DateModal bridge={bridge} initialValue={endDate} />)
    this.setState({ endDate: date })
  }

  handleQboToggle = () => {
    if (Platform.OS === 'android') {
      this.setState({ isExportQbo: true, isExportCsv: false, isExportBitwave: false })
    } else {
      this.setState(state => ({ isExportQbo: !state.isExportQbo }))
    }
  }

  handleCsvToggle = () => {
    if (Platform.OS === 'android') {
      this.setState({ isExportCsv: true, isExportBitwave: false, isExportQbo: false })
    } else {
      this.setState(state => ({ isExportCsv: !state.isExportCsv }))
    }
  }

  handleBitwaveToggle = () => {
    if (Platform.OS === 'android') {
      this.setState({ isExportBitwave: true, isExportCsv: false, isExportQbo: false })
    } else {
      this.setState(state => ({ isExportBitwave: !state.isExportBitwave }))
    }
  }

  handleSubmit = async (): Promise<void> => {
    const { account, defaultIsoFiat, exchangeMultiplier, multiplier, parentMultiplier, route } = this.props
    const { sourceWallet, currencyCode } = route.params
    const { isExportBitwave, isExportQbo, isExportCsv, startDate, endDate } = this.state
    const { tokenId } = this.props
    const tokenCurrencyCode = tokenId ?? sourceWallet.currencyInfo.currencyCode

    let exportTxInfo: ExportTxInfo | undefined
    let exportTxInfoMap: ExportTxInfoMap | undefined
    try {
      const result = await sourceWallet.disklet.getText(EXPORT_TX_INFO_FILE)
      exportTxInfoMap = asExportTxInfoMap(JSON.parse(result))
      exportTxInfo = exportTxInfoMap[tokenCurrencyCode]
    } catch (e) {
      console.log(`Could not read ${EXPORT_TX_INFO_FILE} ${String(e)}. Failure is ok`)
    }

    let accountId = ''
    const fileAccountId = exportTxInfo?.bitwaveAccountId ?? ''

    if (isExportBitwave) {
      accountId =
        (await Airship.show<string | undefined>(bridge => (
          <TextInputModal
            autoFocus
            autoCorrect={false}
            bridge={bridge}
            initialValue={fileAccountId}
            inputLabel={lstrings.export_transaction_bitwave_accountid_modal_input_label}
            message={lstrings.export_transaction_bitwave_accountid_modal_message}
            returnKeyType="next"
            submitLabel={lstrings.string_next_capitalized}
            title={lstrings.export_transaction_bitwave_accountid_modal_title}
          />
        ))) ?? ''
    }

    if (
      exportTxInfo?.bitwaveAccountId !== accountId ||
      exportTxInfo?.isExportBitwave !== isExportBitwave ||
      exportTxInfo?.isExportCsv !== isExportCsv ||
      exportTxInfo?.isExportQbo !== isExportQbo
    ) {
      if (exportTxInfoMap == null) {
        exportTxInfoMap = {}
      }
      exportTxInfoMap[tokenCurrencyCode] = {
        bitwaveAccountId: accountId,
        isExportBitwave,
        isExportQbo,
        isExportCsv
      }
      await sourceWallet.disklet.setText(EXPORT_TX_INFO_FILE, JSON.stringify(exportTxInfoMap))
    }

    if (startDate.getTime() > endDate.getTime()) {
      showError(lstrings.export_transaction_error)
      return
    }

    const now = new Date()

    const walletName = getWalletName(sourceWallet)

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
      .replace(/[^\w\s-]/g, '') // Delete weird characters
      .trim()
      .replace(/[-\s]+/g, '-') // Collapse spaces & dashes

    const rawTxs = await sourceWallet.getTransactions({
      tokenId,
      startDate,
      endDate
    })

    const txs = rawTxs.map(tx => {
      const { mergedData } = getTxActionDisplayInfo(tx, account, sourceWallet)
      const out: EdgeTransaction = { ...tx, metadata: mergedData }
      return out
    })

    const files: File[] = []
    const formats: string[] = []

    // Update the transactions that are missing fiat amounts
    await this.props.updateTxsFiatDispatch(sourceWallet, currencyCode, txs)

    // The non-string result appears to be a bug in the core,
    // which we are relying on to determine if the date range is empty:
    const csvFile = await exportTransactionsToCSV(sourceWallet, defaultIsoFiat, txs, currencyCode, multiplier)
    if (typeof csvFile !== 'string' || csvFile === '' || csvFile == null) {
      showToast(lstrings.export_transaction_export_error)
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
      const qboFile = await exportTransactionsToQBO(txs, defaultIsoFiat, multiplier)
      files.push({
        contents: qboFile,
        mimeType: 'application/vnd.intu.qbo',
        fileName: fileName + '.qbo'
      })
      formats.push('QBO')
    }

    if (isExportBitwave) {
      const bitwaveFile = await exportTransactionsToBitwave(sourceWallet, accountId, txs, currencyCode, exchangeMultiplier, parentMultiplier)
      files.push({
        contents: bitwaveFile,
        mimeType: 'text/comma-separated-values',
        fileName: fileName + '.bitwave.csv'
      })
      formats.push('Bitwave CSV')
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
        failOnCancel: false,
        filename: file.fileName,
        subject: title
      }).catch(error => console.log('Share error', error))
    } catch (error: any) {
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
      failOnCancel: false,
      title,
      urls,
      subject: title
    }).catch(error => showError(error))
  }
}

export const TransactionsExportScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    account: state.core.account,
    defaultIsoFiat: state.ui.settings.defaultIsoFiat,
    exchangeMultiplier: getExchangeDenomByCurrencyCode(params.sourceWallet.currencyConfig, params.currencyCode).multiplier,
    multiplier: selectDisplayDenomByCurrencyCode(state, params.sourceWallet.currencyConfig, params.currencyCode).multiplier,
    parentMultiplier: getExchangeDenom(params.sourceWallet.currencyConfig, null).multiplier,
    tokenId: getTokenIdForced(state.core.account, params.sourceWallet.currencyInfo.pluginId, params.currencyCode)
  }),
  dispatch => ({
    updateTxsFiatDispatch: async (wallet: EdgeCurrencyWallet, currencyCode: string, txs: EdgeTransaction[]) =>
      await dispatch(updateTxsFiat(wallet, currencyCode, txs))
  })
)(withTheme(TransactionsExportSceneComponent))
