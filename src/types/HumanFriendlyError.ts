import { sprintf } from 'sprintf-js'

import { LStringsValues } from '../locales/strings'

/**
 * Error class that is meant to be used for errors that are meant to be shown
 * to the user. The error message must be an lstrings value along with any
 * sprintf arguments.
 *
 * This error type is strictly a GUI error type because of it's dependency
 * on lstrings.
 */
export class HumanFriendlyError extends Error {
  name: string
  message: string

  constructor(format: LStringsValues, ...args: any[]) {
    const message = sprintf(format, ...args)
    super(message)
    this.name = 'HumanFriendlyError'
    this.message = message
  }
}
