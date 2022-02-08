// @flow

export type ResolutionErrorCode =
  | 'UnregisteredDomain'
  | 'UnspecifiedResolver'
  | 'UnsupportedDomain'
  | 'UnspecifiedCurrency'
  | 'NamingServiceDown'
  | 'UnsupportedCurrency'
  | 'IncorrectResolverInterface'
  | 'RecordNotFound'

/**
 * Options passed to the ResolutionError constructor
 */
type ResolutionErrorOptions = {|
  domain: string,
  method?: string,
  currencyTicker?: string,
  recordName?: string
|}

/**
 * Resolution Error class is designed to control every error being thrown by Resolution
 * @param code - Error Code
 * - UnsupportedDomain - domain is not supported by current Resolution instance
 * - NamingServiceDown - blockchain API is down
 * - UnregisteredDomain - domain is not owned by any address
 * - UnspecifiedResolver - domain has no resolver specified
 * - UnspecifiedCurrency - domain resolver doesn't have any address of specified currency
 * - UnsupportedCurrency - currency is not supported
 * - IncorrectResolverInterface - ResolverInterface is incorrected
 * - RecordNotFound - No record was found
 * @param domain - Domain name that was being used
 * @param method
 */
export class ResolutionError extends Error {
  code: ResolutionErrorCode
  domain: string
  method: string
  currencyTicker: string
  recordName: string

  constructor(code: ResolutionErrorCode, options: ResolutionErrorOptions = { domain: '' }) {
    const { domain = '', method = '', currencyTicker = '', recordName = '' } = options
    super(code)
    this.name = 'ResolutionError'
    this.code = code
    this.domain = domain
    this.method = method
    this.currencyTicker = currencyTicker
    this.recordName = recordName
  }
}

export function translateResolutionError(error: ResolutionError): string {
  switch (error.code) {
    case 'UnregisteredDomain':
      return `Domain ${error.domain} is not registered`
    case 'UnspecifiedResolver':
      return `Domain ${error.domain} is not configured`
    case 'UnsupportedDomain':
      return `Domain ${error.domain} is not supported`
    case 'UnspecifiedCurrency':
      return `Domain ${error.domain} has no ${error.currencyTicker} attached to it`
    case 'NamingServiceDown':
      return `${error.method} naming service is down at the moment`
    case 'UnsupportedCurrency':
      return `${error.currencyTicker} is not supported`
    case 'RecordNotFound':
      return `No ${error.recordName} record found for ${error.domain}`
    default:
      return error.message
  }
}
