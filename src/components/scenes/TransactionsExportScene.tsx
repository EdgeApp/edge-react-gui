import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import { sprintf } from 'sprintf-js'

import { syncedSettingsAreTrusted } from '../../actions/SettingsActions'
import { updateTxsFiat } from '../../actions/TransactionExportActions'
import { formatDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import {
  getExchangeDenom,
  selectDisplayDenom
} from '../../selectors/DenominationSelectors'
import { connect } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { errorMessage } from '../../util/errorMessage'
import {
  EXPORT_TX_INFO_FILE,
  type ExportTxInfo,
  exportTxInfoKey,
  mergeExportTxInfo,
  readExportTxInfoMap
} from '../../util/exportTxInfo'
import type { FillTxsFiatResult } from '../../util/fillTxsFiat'
import {
  fillTxMetadataForDisplay,
  getTxActionDisplayInfo
} from '../../util/txDisplay'
import { buildExportFiles, TX_EXPORT_FORMAT_INFO } from '../../util/txExport'
import {
  planTxExport,
  ratesIncompleteWarning,
  type TxExportWarning
} from '../../util/txExport/plan'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { DateModal } from '../modals/DateModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type ThemeProps, withTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsLabelRow } from '../settings/SettingsLabelRow'
import { SettingsRow } from '../settings/SettingsRow'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { MainButton } from '../themed/MainButton'

export interface TransactionsExportParams {
  sourceWallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
}

interface File {
  contents: string
  mimeType: string // 'text/csv'
  fileName: string // wallet-btc-2020.csv
}

type OwnProps = EdgeAppSceneProps<'transactionsExport'>

interface StateProps {
  account: EdgeAccount
  currencyCode: string
  defaultIsoFiat: string
  exchangeMultiplier: string
  /**
   * The display denomination, as one prop rather than two.
   *
   * `mapStateToProps` called `selectDisplayDenom` twice with identical
   * arguments, once for `.multiplier` and once for `.name`, so one
   * denomination arrived as two props and the lookup ran twice on every
   * store change.
   *
   * The *name* matters on its own and is not derived from the multiplier:
   * `exportTransactionsToCSV` used to match it against
   * `wallet.currencyInfo.denominations`, which is the *chain's* list. Every
   * 18-decimal ERC-20 matched ETH there, so a DAI export said
   * `CURRENCY_CODE=DAI` with `DENOMINATION=ETH`, and a 6-decimal token
   * matched nothing and got `''`. The engine passes the name it resolved;
   * this does the same.
   */
  displayDenom: EdgeDenomination
}

interface DispatchProps {
  updateTxsFiatDispatch: (
    wallet: EdgeCurrencyWallet,
    tokenId: EdgeTokenId,
    txs: EdgeTransaction[]
  ) => Promise<FillTxsFiatResult>
}

type Props = StateProps & OwnProps & ThemeProps & DispatchProps

interface State {
  startDate: Date
  endDate: Date
  isExportQbo: boolean
  isExportCsv: boolean
  isExportBitwave: boolean
}

/**
 * The one user-facing sentence per plan warning.
 *
 * A function rather than a ternary chain at the call site, so adding a
 * warning to `TxExportWarning` is a compile error here instead of a case
 * that silently shows the rates message.
 */
function messageForExportWarning(warning: TxExportWarning): string {
  switch (warning.type) {
    case 'bitwaveAccountIdMissing':
      return lstrings.export_transaction_bitwave_accountid_missing
    case 'nothingToExport':
      return lstrings.export_transaction_nothing_exported_bitwave
    case 'ratesIncomplete':
      return sprintf(
        lstrings.export_transaction_rates_incomplete_2s,
        String(warning.unavailable),
        String(warning.asked)
      )
    case 'settingsUntrusted':
      return lstrings.export_transaction_settings_unreadable
  }
}

/**
 * Tell the user what the plan and the fill found, and wait until they have
 * read it.
 */
async function showExportWarnings(warnings: TxExportWarning[]): Promise<void> {
  if (warnings.length === 0) return
  await Airship.show<'ok' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      buttons={{ ok: { label: lstrings.string_ok_cap } }}
      message={warnings.map(messageForExportWarning).join('\n\n')}
    />
  ))
}

class TransactionsExportSceneComponent extends React.PureComponent<
  Props,
  State
> {
  constructor(props: Props) {
    super(props)
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    let lastYear = 0
    if (lastMonth.getMonth() === 11) lastYear = 1 // Decrease year by 1 if previous month was December
    this.state = {
      startDate: new Date(
        new Date().getFullYear() - lastYear,
        lastMonth.getMonth(),
        1,
        0,
        0,
        0
      ),
      endDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
        0,
        0,
        0
      ),
      isExportQbo: false,
      isExportCsv: true,
      isExportBitwave: false
    }
  }

  setThisMonth = (): void => {
    this.setState({
      startDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
        0,
        0,
        0
      ),
      endDate: new Date()
    })
  }

  setLastMonth = (): void => {
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    let lastYear = 0
    if (lastMonth.getMonth() === 11) lastYear = 1 // Decrease year by 1 if previous month was December
    this.setState({
      startDate: new Date(
        new Date().getFullYear() - lastYear,
        lastMonth.getMonth(),
        1,
        0,
        0,
        0
      ),
      endDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
        0,
        0,
        0
      )
    })
  }

  loadInfoFile = async (): Promise<void> => {
    const { sourceWallet, tokenId } = this.props.route.params
    const exportTxInfoMap = await readExportTxInfoMap(sourceWallet)
    const tokenCurrencyCode = exportTxInfoKey(sourceWallet, tokenId)
    const info = exportTxInfoMap[tokenCurrencyCode]
    if (info == null) return

    const { isExportBitwave, isExportCsv, isExportQbo } = info

    this.setState({
      isExportBitwave,
      isExportCsv,
      isExportQbo
    })
  }

  componentDidMount(): void {
    this.loadInfoFile().catch((error: unknown) => {
      console.log(
        `Could not read ${EXPORT_TX_INFO_FILE} ${errorMessage(
          error
        )}. Failure is ok`
      )
    })
  }

  render(): React.ReactElement {
    const { startDate, endDate, isExportBitwave, isExportCsv, isExportQbo } =
      this.state
    const { currencyCode, theme, route } = this.props
    const { sourceWallet } = route.params
    const iconSize = theme.rem(1.25)

    const walletName = `${getWalletName(sourceWallet)} (${currencyCode})`
    const startDateString = formatDate(startDate)
    const endDateString = formatDate(endDate)
    const disabledExport = !isExportQbo && !isExportCsv && !isExportBitwave

    return (
      <SceneWrapper scroll>
        <SettingsRow label={walletName} onPress={() => undefined} />
        <SettingsHeaderRow
          icon={
            <EntypoIcon name="calendar" color={theme.icon} size={iconSize} />
          }
          label={lstrings.export_transaction_date_range}
        />
        <SettingsRow
          label={lstrings.export_transaction_this_month}
          onPress={this.setThisMonth}
        />
        <SettingsRow
          label={lstrings.export_transaction_last_month}
          onPress={this.setLastMonth}
        />
        <SettingsLabelRow
          label={lstrings.string_start}
          right={startDateString}
          onPress={this.handleStartDate}
        />
        <SettingsLabelRow
          label={lstrings.string_end}
          right={endDateString}
          onPress={this.handleEndDate}
        />
        <SettingsHeaderRow
          icon={<EntypoIcon name="export" color={theme.icon} size={iconSize} />}
          label={lstrings.export_transaction_export_type}
        />
        {this.renderSwitches()}
        {disabledExport ? null : (
          <MainButton
            label={lstrings.string_export}
            marginRem={[3, 0, 1]}
            onPress={this.handleSubmit}
            type="secondary"
          />
        )}
      </SceneWrapper>
    )
  }

  renderSwitches(): React.ReactElement {
    const { isExportBitwave, isExportCsv, isExportQbo } = this.state
    return (
      <>
        <SettingsSwitchRow
          label={lstrings.export_transaction_quickbooks_qbo}
          value={isExportQbo}
          onPress={this.handleQboToggle}
        />
        <SettingsSwitchRow
          label={lstrings.export_transaction_csv}
          value={isExportCsv}
          onPress={this.handleCsvToggle}
        />
        <SettingsSwitchRow
          label={lstrings.export_transaction_bitwave_csv}
          value={isExportBitwave}
          onPress={this.handleBitwaveToggle}
        />
      </>
    )
  }

  handleStartDate = async (): Promise<void> => {
    const { startDate } = this.state
    const date = await Airship.show<Date>(bridge => (
      <DateModal bridge={bridge} initialValue={startDate} />
    ))
    this.setState({ startDate: date })
  }

  handleEndDate = async (): Promise<void> => {
    const { endDate } = this.state
    const date = await Airship.show<Date>(bridge => (
      <DateModal bridge={bridge} initialValue={endDate} />
    ))
    this.setState({ endDate: date })
  }

  handleQboToggle = (): void => {
    this.setState(state => ({ isExportQbo: !state.isExportQbo }))
  }

  handleCsvToggle = (): void => {
    this.setState(state => ({ isExportCsv: !state.isExportCsv }))
  }

  handleBitwaveToggle = (): void => {
    this.setState(state => ({ isExportBitwave: !state.isExportBitwave }))
  }

  handleSubmit = async (): Promise<void> => {
    const {
      account,
      currencyCode,
      defaultIsoFiat,
      displayDenom,
      exchangeMultiplier,
      route
    } = this.props
    const { sourceWallet, tokenId } = route.params
    const { isExportBitwave, isExportQbo, isExportCsv, startDate, endDate } =
      this.state
    const tokenCurrencyCode = exportTxInfoKey(sourceWallet, tokenId)

    let exportTxInfo: ExportTxInfo | undefined
    try {
      const exportTxInfoMap = await readExportTxInfoMap(sourceWallet)
      exportTxInfo = exportTxInfoMap[tokenCurrencyCode]
    } catch (error: unknown) {
      // Failure is ok: the saved preferences only pre-fill the Bitwave
      // account id below. The export itself does not need them.
      console.log(
        `Could not read ${EXPORT_TX_INFO_FILE} ${errorMessage(
          error
        )}. Failure is ok`
      )
    }

    // `undefined` until the modal answers, and `undefined` again if it is
    // cancelled: the `?? ''` this replaces threw the distinction away, and
    // `''` then fell back to the saved id — so cancelling meant "use the old
    // one" on the field Bitwave attributes transactions by.
    let accountId: string | undefined
    const fileAccountId = exportTxInfo?.bitwaveAccountId ?? ''

    if (isExportBitwave) {
      // Bitwave account ids are case-sensitive and may start with a lowercase
      // letter, so the platform default of capitalizing the first character
      // would corrupt them. Trim as well, since a pasted id often carries
      // surrounding whitespace:
      const rawAccountId = await Airship.show<string | undefined>(bridge => (
        <TextInputModal
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          bridge={bridge}
          initialValue={fileAccountId}
          inputLabel={
            lstrings.export_transaction_bitwave_accountid_modal_input_label
          }
          message={lstrings.export_transaction_bitwave_accountid_modal_message}
          returnKeyType="next"
          submitLabel={lstrings.string_next_capitalized}
          title={lstrings.export_transaction_bitwave_accountid_modal_title}
        />
      ))
      // A cancel is `undefined`, a submit is the text — including `''` for
      // a field the user emptied, which is a deliberate clear.
      accountId = rawAccountId?.trim()
    }

    // Every decision that does not need the transactions, made before they
    // are read: the refusals below cost nothing but a toast, where deciding
    // after the rate fetch made the user wait minutes for one. `plan.ts`
    // states why each one differs from the engine's equivalent refusal.
    const plan = planTxExport({
      wantCsv: isExportCsv,
      wantQbo: isExportQbo,
      wantBitwave: isExportBitwave,
      modalAccountId: accountId,
      syncedSettingsTrusted: syncedSettingsAreTrusted()
    })

    // The id is only part of the comparison when it was asked for; otherwise
    // the check fired on every CSV-only export of an account that had one
    // saved, and the write below then cleared it.
    const savedAccountId = plan.savedAccountIdPatch
    const idChanged =
      savedAccountId != null &&
      exportTxInfo?.bitwaveAccountId !== savedAccountId
    if (
      idChanged ||
      exportTxInfo?.isExportBitwave !== isExportBitwave ||
      exportTxInfo?.isExportCsv !== isExportCsv ||
      exportTxInfo?.isExportQbo !== isExportQbo
    ) {
      try {
        await mergeExportTxInfo(sourceWallet, tokenId, {
          // The plan's patch: `undefined` keeps what is saved, `''` clears
          // it. See `TxExportPlan.savedAccountIdPatch`.
          bitwaveAccountId: savedAccountId,
          isExportBitwave,
          isExportQbo,
          isExportCsv
        })
      } catch (error: unknown) {
        // Saving the preferences is a side errand, not a precondition.
        // `mergeExportTxInfo` refuses to write over a file it could not read
        // — rightly, since that would lose every asset's saved record — and
        // an unguarded call let that refusal out of `handleSubmit`, into
        // `usePendingPress`'s `showError`: the user got an error drop-down
        // and no CSV, QBO or Bitwave file at all, because this runs before
        // `getTransactions`. The read above tolerates the same failure for
        // the same reason.
        console.log(
          `Could not save ${EXPORT_TX_INFO_FILE} ${errorMessage(
            error
          )}. The export continues`
        )
      }
    }

    if (startDate.getTime() > endDate.getTime()) {
      showError(lstrings.export_transaction_error)
      return
    }

    // No formats means the plan refused, not that there was nothing to
    // write — and it is known now, before any transaction is read.
    if (plan.formats.length === 0) {
      await showExportWarnings(plan.warnings)
      return
    }

    const now = new Date()

    const walletName = getWalletName(sourceWallet)

    const fullCurrencyCode =
      tokenId == null
        ? currencyCode
        : `${sourceWallet.currencyInfo.currencyCode}-${currencyCode}`

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
      // Not `{ ...tx, metadata: mergedData }`: `mergedData` carries only
      // `name`, `category` and `notes`, so the spread replaced `tx.metadata`
      // and dropped `exchangeAmount` — the fiat figure the user may have
      // edited by hand on the transaction details scene. `updateTxsFiatDispatch`
      // below then saw `amountFiat === 0`, re-queried the rates server for
      // that date and wrote the market rate instead, or `0` for every
      // transaction it could not price. `fillTxMetadataForDisplay` overlays
      // the three fields this derivation owns and keeps the rest, which is
      // what the CLI's `get-transactions --export-format` already does, so
      // the two exports of one wallet and range agree.
      return fillTxMetadataForDisplay(tx, mergedData)
    })

    const files: File[] = []
    const formats: string[] = []

    // Update the transactions that are missing fiat amounts
    const fill = await this.props.updateTxsFiatDispatch(
      sourceWallet,
      tokenId,
      txs
    )
    const ratesWarning = ratesIncompleteWarning(fill)
    const warnings =
      ratesWarning == null ? plan.warnings : [...plan.warnings, ratesWarning]

    // One dispatch, shared with `get-transactions --export-format`: which of
    // the resolved values each formatter gets was written out here and again
    // in the engine handler, and four rounds of review found the two
    // disagreeing about it — the fiat column, the CSV/QBO denomination, the
    // Bitwave denomination, the `DENOMINATION` name. Nothing could compare
    // them, because this component is not exported and no test can reach
    // `handleSubmit`.
    //
    // CSV is always rendered, selected or not: the non-string result appears
    // to be a bug in the core, which we are relying on to determine if the
    // date range is empty, and that check has to run whichever formats the
    // user picked.
    const built = await buildExportFiles({
      formats: plan.formats,
      txs,
      currencyCode,
      isoFiat: defaultIsoFiat,
      displayDenom,
      exchangeDenom: { multiplier: exchangeMultiplier },
      bitwaveAccountId: plan.bitwaveAccountId
    })

    const csvFile = built.find(file => file.format === 'csv')?.contents
    if (typeof csvFile !== 'string' || csvFile === '' || csvFile == null) {
      showToast(lstrings.export_transaction_export_error)
      return
    }

    for (const file of built) {
      if (file.format === 'csv' && !isExportCsv) continue
      const info = TX_EXPORT_FORMAT_INFO[file.format]
      files.push({
        contents: file.contents,
        mimeType: info.mimeType,
        fileName: fileName + info.suffix
      })
      formats.push(info.label)
    }

    // Read and dismissed before the share sheet covers the scene: a toast
    // fades in three seconds, under the sheet, and a `0` fiat amount the
    // user was never shown is the silent one writing the file was meant to
    // avoid.
    await showExportWarnings(warnings)

    const title = 'Share Transactions ' + formats.join(', ')
    if (Platform.OS === 'android') {
      await this.shareAndroid(title, files)
    } else {
      await this.shareIos(title, files)
    }
  }

  async shareAndroid(title: string, files: File[]): Promise<void> {
    try {
      const directory = RNFS.ExternalCachesDirectoryPath
      const urls: string[] = []
      for (const file of files) {
        const url = `file://${directory}/${file.fileName}`
        urls.push(url)
        await RNFS.writeFile(
          `${directory}/${file.fileName}`,
          file.contents,
          'utf8'
        )
      }

      await Share.open({
        title,
        message: '',
        urls,
        failOnCancel: false,
        subject: title
      }).catch((error: unknown) => {
        console.log('Share error', error)
      })
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
      await RNFS.writeFile(
        `${directory}/${file.fileName}`,
        file.contents,
        'utf8'
      )
    }

    await Share.open({
      failOnCancel: false,
      title,
      urls,
      subject: title
    }).catch((error: unknown) => {
      showError(error)
    })
  }
}

export const TransactionsExportScene = connect<
  StateProps,
  DispatchProps,
  OwnProps
>(
  (state, { route: { params } }) => ({
    account: state.core.account,
    currencyCode: getCurrencyCode(params.sourceWallet, params.tokenId),
    defaultIsoFiat: state.ui.settings.defaultIsoFiat,
    exchangeMultiplier: getExchangeDenom(
      params.sourceWallet.currencyConfig,
      params.tokenId
    ).multiplier,
    displayDenom: selectDisplayDenom(
      state,
      params.sourceWallet.currencyConfig,
      params.tokenId
    )
  }),
  dispatch => ({
    updateTxsFiatDispatch: async (wallet, tokenId, txs) =>
      await dispatch(updateTxsFiat(wallet, tokenId, txs))
  })
)(withTheme(TransactionsExportSceneComponent))
