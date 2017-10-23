// @flow
// TODO revisit as there is no reason for this to exist OR it should have an action constant coded into it
export function openABAlert (type: string, data: any) {
  return {
    type,
    data
  }
}
