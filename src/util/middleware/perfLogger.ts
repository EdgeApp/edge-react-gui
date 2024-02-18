import RNFS from 'react-native-fs'
import { Middleware } from 'redux'

import { ENV } from '../../env'
import { Dispatch, RootState } from '../../types/reduxTypes'

const perfLoggerCSV = RNFS.DocumentDirectoryPath + '/perfLogger.csv'

if (ENV.ENABLE_REDUX_PERF_LOGGING) {
  RNFS.writeFile(perfLoggerCSV, 'action type,start,end\n', 'utf8')
    .then(success => console.log(`PERF: PerfLogger initialized @ ${perfLoggerCSV}`))
    .catch(error => console.log(error.message))
}

export const perfLogger: Middleware<{}, RootState, Dispatch> = store => next => action => {
  const start = Date.now()
  const result = next(action)
  const end = Date.now()

  if (ENV.ENABLE_REDUX_PERF_LOGGING) {
    RNFS.appendFile(perfLoggerCSV, `${action.type},${start},${end}\n`)
      // Log to the console instead of showError to not spam the user
      .catch(err => console.error(err))
  }
  return result
}
