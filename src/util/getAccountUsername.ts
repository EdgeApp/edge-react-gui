import { EdgeUserInfo } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'

export const getUserInfoUsername = (userInfo: EdgeUserInfo) =>
  userInfo.username == null ? sprintf(lstrings.guest_account_id_1s, userInfo.loginId.slice(userInfo.loginId.length - 3)) : userInfo.username
