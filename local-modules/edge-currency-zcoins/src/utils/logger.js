// @flow
import { type EdgeConsole } from 'edge-core-js'
export const logger: EdgeConsole = { ...console }

export const setLogger = (printer: EdgeConsole) => {
  // $FlowFixMe
  logger.info = printer.info
  // $FlowFixMe
  logger.warn = printer.warn
  // $FlowFixMe
  logger.error = printer.warn
}
