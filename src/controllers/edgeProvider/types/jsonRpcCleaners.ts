import { asEither, asNull, asNumber, asObject, asOptional, asString, asUnknown, asValue, Cleaner } from 'cleaners'

/**
 * Pre-defined JSON-RPC error codes.
 */
export const rpcErrorCodes = {
  methodNotFound: -32601,
  invalidParams: -32602,
  // We can define our own codes greater than -32000:
  unknown: -1
} as const

/**
 * A JSON-RPC error object.
 */
export const asRpcError = asObject({
  code: asNumber,
  data: asUnknown,
  message: asString
})
export type RpcError = ReturnType<typeof asRpcError>

export type RpcId = string | number | null
export const asRpcId: Cleaner<RpcId> = asEither(asString, asNumber, asNull)

/**
 * The web page sends this message to call an EdgeProvider method.
 */
export const asRpcCall = asObject({
  id: asRpcId,
  jsonrpc: asValue<['2.0']>('2.0'),
  method: asString,
  params: asUnknown
})
export type RpcCall = ReturnType<typeof asRpcCall>

/**
 * The Edge app sends this back as a reply.
 */
export const asRpcReturn = asObject({
  jsonrpc: asValue<['2.0']>('2.0'),
  result: asUnknown,
  error: asOptional(asRpcError),
  id: asRpcId
})
export type RpcReturn = ReturnType<typeof asRpcReturn>
