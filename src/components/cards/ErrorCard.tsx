import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { normalizeError } from '../../util/normalizeError'
import { trackError } from '../../util/tracking'
import { RawTextModal } from '../modals/RawTextModal'
import { Airship, showToast } from '../services/AirshipInstance'
import { AlertCardUi4 } from './AlertCard'

/**
 * An error that is localized and can be displayed to the user.
 */
export class I18nError extends Error {
  constructor(public readonly title: string, public readonly message: string) {
    super(message)
    this.name = 'I18nError'
  }
}

interface Props {
  error: unknown
}

/**
 * This displays an AlertCardUi4 with a localized error message.
 *
 * If the error is an I18nError, it will display the localized message.
 * Otherwise, it will display a localized generic error message with a report
 * error button for unexpected errors.
 *
 * TODO: Add a warning variant
 */
export const ErrorCard: React.FC<Props> = props => {
  const { error } = props

  const isDevMode = useSelector(state => state.ui.settings.developerModeOn)
  const [errorIdentifier, setErrorIdentifier] = React.useState<
    { eventId: string } | { aggregateId: string }
  >()

  // Reset error identifier when error changes
  React.useEffect(() => {
    setErrorIdentifier(undefined)
  }, [error])

  const handleReportError = useHandler((): void => {
    if (error != null) {
      const errorIdentifier = trackError(error, 'AlertDropdown_Report', {
        userReportedError: true
      })
      setErrorIdentifier(errorIdentifier)
    }
  })

  const handleCopyEventId = useHandler((): void => {
    if (errorIdentifier != null) {
      const id =
        'eventId' in errorIdentifier
          ? errorIdentifier.eventId
          : errorIdentifier.aggregateId
      Clipboard.setString(id)
      showToast(lstrings.fragment_error_report_id_copied)
    }
  })

  const handleShowError = useHandler(async (): Promise<void> => {
    await Airship.show(bridge => (
      <RawTextModal bridge={bridge} body={normalizeError(error).toString()} />
    ))
  })

  // Happy path
  if (error instanceof I18nError) {
    return (
      <AlertCardUi4 type="error" title={error.title} body={error.message} />
    )
  }

  const reportSent = errorIdentifier != null

  const isAggregateError =
    errorIdentifier != null && 'aggregateId' in errorIdentifier
  const copyLabel = isAggregateError
    ? lstrings.fragment_copy_aggregate_id
    : lstrings.fragment_copy_event_id

  const buttonProps =
    isDevMode || __DEV__
      ? {
          label: lstrings.string_show_error,
          onPress: handleShowError
        }
      : reportSent
      ? {
          label: copyLabel,
          onPress: handleCopyEventId
        }
      : {
          label: lstrings.string_report_error,
          onPress: handleReportError
        }

  const idLabel =
    errorIdentifier != null && 'eventId' in errorIdentifier
      ? lstrings.fragment_event_id
      : lstrings.fragment_aggregate_id
  const idValue =
    errorIdentifier != null
      ? 'eventId' in errorIdentifier
        ? errorIdentifier.eventId
        : errorIdentifier.aggregateId
      : ''
  const bodyText = reportSent
    ? `${lstrings.string_report_sent}\n\n${idLabel}: ${idValue}`
    : lstrings.error_generic_message

  // Unhappy path
  return (
    <AlertCardUi4
      type="error"
      title={lstrings.error_unexpected_title}
      body={bodyText}
      button={buttonProps}
    />
  )
}
