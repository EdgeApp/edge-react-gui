// @flow
/** Explains Resolution Error options */
type ResolutionErrorOptions = {
  domain: string,
  method?: string,
  currencyTicker?: string,
  recordName?: string
}

/** Alias for Resolution error handler function */
type ResolutionErrorHandler = (error: ResolutionErrorOptions) => string

export const ResolutionErrorCode = {
  UnregisteredDomain: 'UnregisteredDomain',
  UnspecifiedResolver: 'UnspecifiedResolver',
  UnsupportedDomain: 'UnsupportedDomain',
  UnspecifiedCurrency: 'UnspecifiedCurrency',
  NamingServiceDown: 'NamingServiceDown',
  UnsupportedCurrency: 'UnsupportedCurrency',
  IncorrectResolverInterface: 'IncorrectResolverInterface',
  RecordNotFound: 'RecordNotFound'
}

/**
 * @internal
 * Internal Mapping object from ResolutionErrorCode to a ResolutionErrorHandler
 */
const HandlersByCode = {
  [ResolutionErrorCode.UnregisteredDomain]: (params: { domain: string }) => `Domain ${params.domain} is not registered`,
  [ResolutionErrorCode.UnspecifiedResolver]: (params: { domain: string }) => `Domain ${params.domain} is not configured`,
  [ResolutionErrorCode.UnsupportedDomain]: (params: { domain: string }) => `Domain ${params.domain} is not supported`,
  [ResolutionErrorCode.UnspecifiedCurrency]: (params: { domain: string, currencyTicker: string }) =>
    `Domain ${params.domain} has no ${params.currencyTicker} attached to it`,
  [ResolutionErrorCode.NamingServiceDown]: (params: { method: string }) => `${params.method} naming service is down at the moment`,
  [ResolutionErrorCode.UnsupportedCurrency]: (params: { currencyTicker: string }) => `${params.currencyTicker} is not supported`,
  [ResolutionErrorCode.RecordNotFound]: (params: { recordName: string, domain: string }) => `No ${params.recordName} record found for ${params.domain}`
}

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
  code: string
  message: string
  domain: string
  method: string
  currencyTicker: string

  constructor(code: string, options: ResolutionErrorOptions = { domain: '' }) {
    const resolutionErrorHandler: ResolutionErrorHandler = HandlersByCode[code]
    const { domain, method, currencyTicker, recordName } = options
    super(resolutionErrorHandler({ domain, method, currencyTicker, recordName }))
    this.code = code
    this.domain = domain
    this.method = method || ''
    this.currencyTicker = currencyTicker || ''
    this.name = 'ResolutionError'
    Object.setPrototypeOf(this, ResolutionError.prototype)
  }
}
