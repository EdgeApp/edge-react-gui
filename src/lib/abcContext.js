// import abc from 'airbitz-core-js'
import {abc} from './abc.webpack'
import LocalStorage from './LocalStorage'
global.localStorage = new LocalStorage('./db.json')
const abcContext = abc.makeContext({
  apiKey: '3ad0717b3eb31f745aba7bd9d51e7fd1b2926431',
  accountType: 'account:repo:co.airbitz.wallet'
})

export default abcContext
