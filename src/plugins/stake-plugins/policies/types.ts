import { ChangeQuote, ChangeQuoteRequest, StakePosition, StakePositionRequest } from '../types'

export type StakePluginPolicy = {
  fetchChangeQuote: (request: ChangeQuoteRequest) => Promise<ChangeQuote>
  fetchStakePosition: (request: StakePositionRequest) => Promise<StakePosition>
}
