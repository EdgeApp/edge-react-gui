import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { trackError } from '../../util/tracking'
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
 */
export const ErrorCard: React.FC<Props> = props => {
  const { error } = props

  const [reportSent, setReportSent] = React.useState(false)

  const handleReportError = useHandler((): void => {
    if (error != null) {
      trackError(error, 'AlertDropdown_Report', {
        userReportedError: true
      })
      setReportSent(true)
    }
  })

  // Happy path
  if (error instanceof I18nError) {
    return (
      <AlertCardUi4 type="error" title={error.title} body={error.message} />
    )
  }

  // Unhappy path
  return (
    <AlertCardUi4
      type="error"
      title={lstrings.error_unexpected_title}
      body={lstrings.error_generic_message}
      button={{
        label: reportSent
          ? lstrings.string_report_sent
          : lstrings.string_report_error,
        disabled: reportSent,
        onPress: handleReportError
      }}
    />
  )
}
