// @flow

export const isRejectedFioRequest = (status: string) => {
  return status === 'rejected'
}
export const isSentFioRequest = (status: string) => {
  return status === 'sent_to_blockchain'
}
