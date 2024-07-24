import type {
  ActionDto,
  ActionRequestDto,
  ConstructTransactionRequestDto,
  PendingActionRequestDto,
  SubmitHashRequestDto,
  TransactionDto,
  YieldBalanceDto,
  YieldBalanceRequestDto
} from '@stakekit/api-hooks'
import { asMaybe, asObject, asValue } from 'cleaners'
import { InsufficientFundsError } from 'edge-core-js'

import { ENV } from '../../../../env'

const baseUrl = 'https://api.stakek.it'
const headers = { 'Content-Type': 'application/json', 'X-API-KEY': ENV.STAKEKIT_API_KEY ?? '' }

const fetchPatch = async <Body, Res>(path: string, body: Body): Promise<Res> => {
  const response = await fetch(baseUrl + path, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  })
  return await response.json()
}
const fetchPost = async <Body, Res>(path: string, body: Body): Promise<Res> => {
  const response = await fetch(baseUrl + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  return await response.json()
}

export const actionEnter = async (actionRequestDto: ActionRequestDto): Promise<ActionDto> => {
  const out = await fetchPost<ActionRequestDto, ActionDto>('/v1/actions/enter', actionRequestDto)
  checkInsufficientFunds(out)
  return out
}
export const actionExit = async (actionRequestDto: ActionRequestDto): Promise<ActionDto> => {
  const out = await fetchPost<ActionRequestDto, ActionDto>('/v1/actions/exit', actionRequestDto)
  checkInsufficientFunds(out)
  return out
}
export const actionPending = async (pendingActionRequestDto: PendingActionRequestDto): Promise<ActionDto> => {
  const out = await fetchPost<PendingActionRequestDto, ActionDto>('/v1/actions/pending', pendingActionRequestDto)
  checkInsufficientFunds(out)
  return out
}
export const transactionConstruct = async (transactionId: string, constructTransactionRequestDto: ConstructTransactionRequestDto): Promise<TransactionDto> => {
  return await fetchPatch<ConstructTransactionRequestDto, TransactionDto>(`/v1/transactions/${transactionId}`, constructTransactionRequestDto)
}
export const transactionSubmitHash = async (transactionId: string, submitHashRequestDto: SubmitHashRequestDto): Promise<void> => {
  await fetch(baseUrl + `/v1/transactions/${transactionId}/submit_hash`, {
    method: 'POST',
    headers,
    body: JSON.stringify(submitHashRequestDto)
  })
}
export const yieldGetSingleYieldBalances = async (integrationId: string, yieldBalanceRequestDto: YieldBalanceRequestDto): Promise<YieldBalanceDto[]> => {
  return await fetchPost<YieldBalanceRequestDto, YieldBalanceDto[]>(`/v1/yields/${integrationId}/balances`, yieldBalanceRequestDto)
}

const checkInsufficientFunds = (res: unknown): void => {
  const maybeStakeKitInsufficientFundsError = asMaybe(asObject({ message: asValue('InsufficientFundsError') }))(res)
  if (maybeStakeKitInsufficientFundsError != null) {
    throw new InsufficientFundsError({ tokenId: null })
  }
}
