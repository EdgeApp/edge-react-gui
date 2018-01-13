import * as Constants from '../../../constants/indexConstants.js'
export const addAccount = (account) => ({
  type: Constants.ADD_ACCOUNT,
  data: {account}
})
