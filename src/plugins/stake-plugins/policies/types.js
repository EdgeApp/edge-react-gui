// @flow
import { type ChangeQuote, type ChangeQuoteRequest, type StakePosition, type StakePositionRequest } from '../types'

export type StakePluginPolicy = {
  fetchChangeQuote: (request: ChangeQuoteRequest) => Promise<ChangeQuote>,
  fetchStakePosition: (request: StakePositionRequest) => Promise<StakePosition>
}
