// @flow

export const isRejectedFioRequest = (status: string): boolean => {
  return status === 'rejected'
}
export const isSentFioRequest = (status: string): boolean => {
  return status === 'sent_to_blockchain'
}
